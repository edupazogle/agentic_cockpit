from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class Concern:
    id: UUID
    pilot_id: UUID
    severity: str
    title: str
    body: str | None
    origin_movement: str | None
    status: str
    ts: datetime


_SEVERITY_ORDER = {'critical': 0, 'warning': 1, 'info': 2}


def add_concern(
    db,
    *,
    pilot_id: UUID,
    severity: str,
    title: str,
    body: str | None,
    origin_movement: str | None,
    origin_message_id: UUID | None = None,
    tenant_id: str,
) -> Concern:
    if severity not in ('info', 'warning', 'critical'):
        raise ValueError(f"unknown severity {severity}")
    cid = uuid4()
    db.execute(
        """
        insert into pilot_concern
          (id, pilot_id, severity, title, body, origin_movement, origin_message_id, tenant_id)
        values (%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (cid, pilot_id, severity, title, body, origin_movement, origin_message_id, tenant_id),
    )
    db.commit()
    return Concern(
        id=cid,
        pilot_id=pilot_id,
        severity=severity,
        title=title,
        body=body,
        origin_movement=origin_movement,
        status='open',
        ts=datetime.utcnow(),
    )


def ack_concern(db, *, concern_id: UUID, tenant_id: str) -> None:
    sev = db.execute(
        "select severity from pilot_concern where id=%s and tenant_id=%s",
        (concern_id, tenant_id),
    ).scalar_one_or_none()
    if sev is None:
        raise ValueError("concern not found")
    if sev == 'critical':
        raise ValueError("critical concerns cannot be acked; resolve via artifact")
    db.execute(
        "update pilot_concern set status='acked', acked_at=now() where id=%s and tenant_id=%s",
        (concern_id, tenant_id),
    )
    db.commit()


def resolve_concern(
    db,
    *,
    concern_id: UUID,
    resolution_artifact_id: UUID | None,
    tenant_id: str,
) -> None:
    db.execute(
        "update pilot_concern set status='resolved', resolved_at=now(), "
        "resolution_artifact_id=%s where id=%s and tenant_id=%s",
        (resolution_artifact_id, concern_id, tenant_id),
    )
    db.commit()


def list_open_concerns(
    db, *, pilot_id: UUID, tenant_id: str
) -> list[Concern]:
    rows = db.execute(
        "select id, pilot_id, severity, title, body, origin_movement, status, ts "
        "from pilot_concern where pilot_id=%s and tenant_id=%s and status='open' "
        "order by case severity when 'critical' then 0 when 'warning' then 1 else 2 end, ts",
        (pilot_id, tenant_id),
    ).fetchall()
    return [Concern(*r) for r in rows]


def has_critical_open(db, *, pilot_id: UUID, tenant_id: str) -> bool:
    n = db.execute(
        "select count(*) from pilot_concern "
        "where pilot_id=%s and tenant_id=%s and status='open' and severity='critical'",
        (pilot_id, tenant_id),
    ).scalar_one()
    return n > 0
