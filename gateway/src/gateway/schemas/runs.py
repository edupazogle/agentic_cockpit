"""Pydantic schemas for scenario run orchestration."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class RunStatus(StrEnum):
    queued = "queued"
    running = "running"
    waiting = "waiting"
    completed = "completed"
    failed = "failed"
    failed_sla = "failed_sla"


class StepStatus(StrEnum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class Orchestrator(StrEnum):
    n8n = "n8n"
    langflow = "langflow"


class CreateRunRequest(BaseModel):
    claim_id: str = Field(..., pattern=r"^CLM-\d{4}-\d{4}$")
    pilot_id: str
    orchestrator: Orchestrator | None = None


class RunResponse(BaseModel):
    id: UUID
    claim_id: str
    pilot_id: str
    status: RunStatus
    orchestrator: Orchestrator
    step_idempotency_keys: dict[str, str] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class StepRequest(BaseModel):
    step_key: str
    step_idempotency_key: str = Field(default_factory=lambda: uuid4().hex)
    context: dict = Field(default_factory=dict)


class StepOutput(BaseModel):
    step_key: str
    output: dict
    signal: str | None = None
    evidence: dict | None = None
    options: list[str] | None = None


class ResumeRequest(BaseModel):
    decision: str
    rationale: str
    operator_id: UUID | None = None


class RunEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    event_type: str  # RUN_QUEUED, STEP_STARTED, STEP_DONE, RUN_COMPLETED, HITL_PAUSED, HITL_RESUMED
    step_key: str | None = None
    step_idempotency_key: str | None = None
    payload: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
