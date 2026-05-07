"""Ship pipeline orchestrator — 6-phase ship with resume, rollback, and audit."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4


class Phase(StrEnum):
    PARSE = "1_parse"
    COMPOSE = "2_compose"
    LINT = "3_lint"
    WIRE = "4_wire"
    DEPLOY = "5_deploy"
    VERIFY = "6_verify"


PHASE_ORDER = [Phase.PARSE, Phase.COMPOSE, Phase.LINT, Phase.WIRE, Phase.DEPLOY, Phase.VERIFY]


class ShipStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ShipPhaseEvent:
    id: UUID
    ship_run_id: UUID
    phase: str
    module_id: UUID | None
    event_type: str
    line: str
    ts: datetime
    status: str | None
    payload: dict | None
    tenant_id: str


@dataclass
class ShipRun:
    id: UUID
    pilot_id: UUID
    started_at: datetime
    finished_at: datetime | None
    status: str
    langfuse_session_id: str | None
    total_cost_eur: float
    bundle_sha: str | None
    tenant_id: str
    phase_events: list[ShipPhaseEvent] = field(default_factory=list)


def create_ship_run(
    db, *, pilot_id: UUID, tenant_id: str, langfuse_session_id: str | None = None
) -> ShipRun:
    sid = uuid4()
    db.execute(
        """insert into ship_run (id, pilot_id, langfuse_session_id, tenant_id)
           values (%s,%s,%s,%s)""",
        (sid, pilot_id, langfuse_session_id, tenant_id),
    )
    db.commit()
    return ShipRun(
        id=sid, pilot_id=pilot_id, started_at=datetime.utcnow(),
        finished_at=None, status=ShipStatus.QUEUED,
        langfuse_session_id=langfuse_session_id, total_cost_eur=0,
        bundle_sha=None, tenant_id=tenant_id,
    )


def record_phase_event(
    db, *, ship_run_id: UUID, phase: Phase, event_type: str, line: str,
    module_id: UUID | None = None, status: str | None = None,
    payload: dict | None = None, tenant_id: str,
) -> ShipPhaseEvent:
    eid = uuid4()
    db.execute(
        """insert into ship_phase_event
           (id, ship_run_id, phase, module_id, event_type, line, status, payload, tenant_id)
           values (%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)""",
        (eid, ship_run_id, phase.value, module_id, event_type, line, status,
         __import__('json').dumps(payload or {}), tenant_id),
    )
    db.commit()
    return ShipPhaseEvent(
        id=eid, ship_run_id=ship_run_id, phase=phase.value,
        module_id=module_id, event_type=event_type, line=line,
        ts=datetime.utcnow(), status=status, payload=payload, tenant_id=tenant_id,
    )


def get_last_completed_phase(db, *, ship_run_id: UUID, tenant_id: str) -> Phase | None:
    rows = db.execute(
        """select phase from ship_phase_event
           where ship_run_id=%s and tenant_id=%s and event_type='success'
           order by ts desc limit 1""",
        (ship_run_id, tenant_id),
    ).fetchall()
    if not rows:
        return None
    completed = {r[0] for r in rows}
    for p in reversed(PHASE_ORDER):
        if p.value in completed:
            return p
    return None


def resume_ship_run(
    db, *, ship_run_id: UUID, tenant_id: str
) -> Phase:
    """Return the next phase to execute (resume from last success + 1)."""
    last = get_last_completed_phase(db, ship_run_id=ship_run_id, tenant_id=tenant_id)
    if last is None:
        return Phase.PARSE
    idx = PHASE_ORDER.index(last)
    if idx + 1 >= len(PHASE_ORDER):
        return Phase.VERIFY  # all done, re-verify
    return PHASE_ORDER[idx + 1]


def complete_ship_run(
    db, *, ship_run_id: UUID, tenant_id: str, bundle_sha: str | None = None
) -> None:
    db.execute(
        "update ship_run set status='completed', finished_at=now(), bundle_sha=%s "
        "where id=%s and tenant_id=%s",
        (bundle_sha, ship_run_id, tenant_id),
    )
    db.commit()


def fail_ship_run(db, *, ship_run_id: UUID, tenant_id: str) -> None:
    db.execute(
        "update ship_run set status='failed', finished_at=now() "
        "where id=%s and tenant_id=%s",
        (ship_run_id, tenant_id),
    )
    db.commit()


def cancel_ship_run(db, *, ship_run_id: UUID, tenant_id: str) -> None:
    db.execute(
        "update ship_run set status='cancelled', finished_at=now() "
        "where id=%s and tenant_id=%s",
        (ship_run_id, tenant_id),
    )
    db.commit()
