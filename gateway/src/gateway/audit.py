"""Append-only audit event log — all state mutations are recorded here."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

import structlog

logger = structlog.get_logger()


class AuditAction(StrEnum):
    # Auth
    AUTH_LOGIN = "auth.login"
    AUTH_LOGOUT = "auth.logout"
    AUTH_FAILED = "auth.failed"

    # Scenario runs
    RUN_CREATED = "run.created"
    RUN_STARTED = "run.started"
    RUN_COMPLETED = "run.completed"
    RUN_FAILED = "run.failed"
    RUN_CANCELLED = "run.cancelled"

    # HITL
    HITL_PAUSED = "hitl.paused"
    HITL_RESUMED = "hitl.resumed"
    HITL_APPROVED = "hitl.approved"
    HITL_REJECTED = "hitl.rejected"

    # Pilot
    PILOT_LEVEL_CHANGED = "pilot.level_changed"
    PILOT_ARTIFACT_CREATED = "pilot.artifact_created"

    # Webhooks
    WEBHOOK_REJECTED = "webhook.rejected"


def build_audit_row(
    *,
    tenant_id: str,
    action: AuditAction | str,
    actor_id: str | None,
    resource_type: str,
    resource_id: str,
    payload: dict[str, Any] | None = None,
    chain_position: int | None = None,
    prev_hash: str | None = None,
) -> dict[str, Any]:
    """
    Build an audit log row dict.

    The actual chain hashing and insertion is done in the SQL migration
    (0009_runtime_safety.sql) via a Postgres function that computes the
    SHA-256 chain hash server-side to prevent race conditions.

    This function constructs the payload that gets passed to that function.
    """
    return {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "action": str(action),
        "actor_id": actor_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "payload": payload or {},
        "recorded_at": datetime.now(UTC).isoformat(),
    }


async def append_audit_event(
    *,
    tenant_id: str,
    action: AuditAction | str,
    actor_id: str | None,
    resource_type: str,
    resource_id: str,
    payload: dict[str, Any] | None = None,
    supabase_client: object = None,
) -> None:
    """
    Append an audit event to the audit_log table.

    Uses the Postgres `append_audit_event` function which enforces
    append-only semantics and chain hash integrity.
    """
    row = build_audit_row(
        tenant_id=tenant_id,
        action=action,
        actor_id=actor_id,
        resource_type=resource_type,
        resource_id=resource_id,
        payload=payload,
    )

    if supabase_client is None:
        # Fallback: log only (local dev without Supabase)
        logger.info("audit_event_local_only", **row)
        return

    try:
        # Insert via RPC that computes chain hash server-side
        await supabase_client.rpc("append_audit_event", row).execute()  # type: ignore[attr-defined]
    except Exception as exc:
        # Audit failures must be surfaced, never silently swallowed
        logger.error(
            "audit_write_failed",
            error=str(exc),
            action=str(action),
            resource_id=resource_id,
        )
        raise
