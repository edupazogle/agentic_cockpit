"""Run-store event types — append-only event definitions."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    FAILED_SLA = "failed_sla"  # Added in 0009_runtime_safety


class RunEventType(StrEnum):
    CREATED = "run.created"
    STARTED = "run.started"
    NODE_ENTERED = "run.node.entered"
    NODE_EXITED = "run.node.exited"
    HITL_PAUSED = "run.hitl.paused"
    HITL_RESUMED = "run.hitl.resumed"
    COMPLETED = "run.completed"
    FAILED = "run.failed"
    CANCELLED = "run.cancelled"
    SLA_EXCEEDED = "run.sla.exceeded"


class RunEvent(BaseModel):
    """
    A single immutable event in a run's lifecycle.

    Events are append-only — never update or delete an event row.
    Use idempotency_key to deduplicate webhook/callback replays.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str
    tenant_id: str
    event_type: RunEventType | str
    step_key: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    idempotency_key: str | None = None
    recorded_at: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )


def new_run_id() -> str:
    return str(uuid.uuid4())
