from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4


@dataclass
class ArtifactProposal:
    id: UUID
    pilot_id: UUID
    artifact_id: UUID | None
    artifact_kind: str
    version_from: int | None
    proposed_content: dict[str, Any]
    rationale: str | None
    citations: list[Any]
    originating_message_id: UUID | None
    status: str
    decided_at: datetime | None
    decided_by: UUID | None
    tenant_id: str


def _json(o: Any) -> str:
    return json.dumps(o)


def propose_diff(
    db,
    *,
    pilot_id: UUID,
    artifact_id: UUID | None,
    artifact_kind: str,
    version_from: int | None,
    proposed_content: dict,
    rationale: str | None,
    citations: list,
    originating_message_id: UUID | None,
    tenant_id: str,
) -> ArtifactProposal:
    pid = uuid4()
    db.execute(
        """
        insert into artifact_proposal
          (id, pilot_id, artifact_id, artifact_kind, version_from,
           proposed_content, rationale, citations, originating_message_id, tenant_id)
        values (%s,%s,%s,%s,%s,%s::jsonb,%s,%s::jsonb,%s,%s)
        """,
        (
            pid,
            pilot_id,
            artifact_id,
            artifact_kind,
            version_from,
            _json(proposed_content),
            rationale,
            _json(citations or []),
            originating_message_id,
            tenant_id,
        ),
    )
    db.commit()
    return ArtifactProposal(
        id=pid,
        pilot_id=pilot_id,
        artifact_id=artifact_id,
        artifact_kind=artifact_kind,
        version_from=version_from,
        proposed_content=proposed_content,
        rationale=rationale,
        citations=citations or [],
        originating_message_id=originating_message_id,
        status='pending',
        decided_at=None,
        decided_by=None,
        tenant_id=tenant_id,
    )


def accept_proposal(
    db, *, proposal_id: UUID, decided_by: UUID, tenant_id: str
) -> None:
    row = db.execute(
        "select pilot_id, artifact_id, artifact_kind, proposed_content, version_from "
        "from artifact_proposal where id=%s and tenant_id=%s and status='pending'",
        (proposal_id, tenant_id),
    ).fetchone()
    if not row:
        raise ValueError(f"Proposal {proposal_id} not pending or not found")
    pilot_id, artifact_id, kind, content, vfrom = row
    new_version = (vfrom or 0) + 1
    if artifact_id:
        db.execute(
            "update pilot_artifact set retired_at=now() where id=%s and retired_at is null",
            (artifact_id,),
        )
        db.execute(
            """
            insert into pilot_artifact
            (id, pilot_id, kind, version, content, parent_id, created_by, tenant_id)
            values (%s, %s, %s, %s, %s::jsonb, %s, 'companion', %s)
            """,
            (
                artifact_id,
                pilot_id,
                kind,
                new_version,
                _json(content),
                artifact_id,
                tenant_id,
            ),
        )
    else:
        db.execute(
            """
            insert into pilot_artifact (pilot_id, kind, version, content, created_by, tenant_id)
            values (%s, %s, 1, %s::jsonb, 'companion', %s)
            """,
            (pilot_id, kind, _json(content), tenant_id),
        )
    db.execute(
        "update artifact_proposal set status='accepted',"
        " decided_at=now(), decided_by=%s where id=%s",
        (decided_by, proposal_id),
    )
    db.commit()


def reject_proposal(
    db, *, proposal_id: UUID, decided_by: UUID, tenant_id: str
) -> None:
    db.execute(
        "update artifact_proposal set status='rejected', decided_at=now(), decided_by=%s "
        "where id=%s and tenant_id=%s and status='pending'",
        (decided_by, proposal_id, tenant_id),
    )
    db.commit()


def list_pending_proposals(
    db, *, pilot_id: UUID, tenant_id: str
) -> list[ArtifactProposal]:
    rows = db.execute(
        "select id, pilot_id, artifact_id, artifact_kind, version_from, "
        "proposed_content, rationale, citations, originating_message_id, "
        "status, decided_at, decided_by, tenant_id "
        "from artifact_proposal"
        " where pilot_id=%s and tenant_id=%s and status='pending' order by created_at",
        (pilot_id, tenant_id),
    ).fetchall()
    return [ArtifactProposal(*r) for r in rows]
