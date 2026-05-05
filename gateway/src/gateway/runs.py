"""Scenario run FSM — owns the orchestration lifecycle.

State machine: queued → running → (waiting → running)* → (completed | failed | failed_sla)

Each run is owned by the gateway. Langflow or n8n executes individual steps;
the gateway owns the FSM, idempotency, and durability.
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from supabase import AsyncClient

from gateway.clients.langflow_client import LangflowClient
from gateway.hitl import HitlBridge
from gateway.posthog_flags import PostHogFlags
from gateway.schemas.runs import (
    CreateRunRequest,
    RunResponse,
    RunStatus,
    StepOutput,
)


class RunManager:
    """Owns the scenario run FSM."""

    def __init__(self, db: AsyncClient) -> None:
        self.db = db
        self.langflow = LangflowClient()
        self.hitl = HitlBridge(db)
        self.flags = PostHogFlags()

    async def create_run(
        self, req: CreateRunRequest, session_header: str | None = None
    ) -> RunResponse:
        """Create a new scenario run and determine the orchestrator."""
        run_id = uuid4()
        now = datetime.now(UTC)

        orchestrator = req.orchestrator or await self.flags.get_orchestrator(
            req.claim_id, session_header
        )

        await self.db.table("scenario_runs").insert({
            "id": str(run_id),
            "claim_id": req.claim_id,
            "pilot_id": req.pilot_id,
            "status": RunStatus.queued.value,
            "orchestrator": orchestrator.value,
            "node_states": {},
            "tenant_id": "gdai-default",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }).execute()

        return RunResponse(
            id=run_id,
            claim_id=req.claim_id,
            pilot_id=req.pilot_id,
            status=RunStatus.queued,
            orchestrator=orchestrator,
            created_at=now,
            updated_at=now,
        )

    async def step(
        self,
        run_id: UUID,
        step_key: str,
        step_idempotency_key: str,
        flow_id: str,
        context: dict,
    ) -> StepOutput:
        """Execute a single step with idempotency protection.

        The step_idempotency_key ensures that retrying the same step after a
        Langflow crash produces no duplicate side effects.
        """
        await self._transition(run_id, RunStatus.running)

        # Record the key for audit
        await self._append_event(run_id, "STEP_STARTED", step_key, step_idempotency_key)

        result = await self.langflow.run_step(
            flow_id=flow_id,
            step_key=step_key,
            step_idempotency_key=step_idempotency_key,
            context=context,
        )

        output = StepOutput(
            step_key=step_key,
            output=result.get("output", {}),
            signal=result.get("_signal"),
            evidence=result.get("evidence"),
            options=result.get("options"),
        )

        # Handle HITL signal from Langflow (per AXA-2 Spike A: RequiresHumanReview component)
        if output.signal == "requires_human_review":
            await self.hitl.pause(
                run_id=run_id,
                step_key=step_key,
                evidence=output.evidence or {},
                options=output.options or ["Approve", "Reject"],
            )
            await self._append_event(run_id, "HITL_PAUSED", step_key, step_idempotency_key)

        await self._append_event(run_id, "STEP_DONE", step_key, step_idempotency_key)
        return output

    async def resume_run(self, run_id: UUID, decision: str, rationale: str) -> dict:
        """Resume a run paused at a HITL gate.

        Returns the structured diff for Langflow context (per AXA-2 Spike C).
        """
        run = await self._get_run(run_id)
        if run["status"] != RunStatus.waiting.value:
            raise ValueError(f"Run {run_id} is not waiting (status={run['status']})")

        _, structured_diff = await self.hitl.resume(
            run_id=run_id, decision=decision, rationale=rationale
        )
        await self._append_event(run_id, "HITL_RESUMED", None, None)
        return structured_diff

    async def complete_run(self, run_id: UUID, success: bool = True) -> None:
        """Mark a run as completed or failed."""
        status = RunStatus.completed if success else RunStatus.failed
        now = datetime.now(UTC)
        await self.db.table("scenario_runs").update({
            "status": status.value,
            "updated_at": now.isoformat(),
        }).eq("id", str(run_id)).execute()
        await self._append_event(run_id, "RUN_COMPLETED" if success else "RUN_FAILED", None, None)

    async def cancel_run(self, run_id: UUID) -> None:
        """Cancel a queued or running run."""
        run = await self._get_run(run_id)
        if run["status"] not in (RunStatus.queued.value, RunStatus.running.value):
            raise ValueError(f"Cannot cancel run in status {run['status']}")
        now = datetime.now(UTC)
        await self.db.table("scenario_runs").update({
            "status": RunStatus.failed.value,
            "updated_at": now.isoformat(),
        }).eq("id", str(run_id)).execute()

    async def _get_run(self, run_id: UUID) -> dict:
        result = await self.db.table("scenario_runs").select("*").eq(
            "id", str(run_id)
        ).single().execute()
        return result.data

    async def _transition(self, run_id: UUID, to_status: RunStatus) -> None:
        """Validate and apply a state transition."""
        valid_transitions = {
            RunStatus.queued: {RunStatus.running},
            RunStatus.running: {
                RunStatus.running, RunStatus.waiting,
                RunStatus.completed, RunStatus.failed,
            },
            RunStatus.waiting: {RunStatus.running},
        }
        run = await self._get_run(run_id)
        current = RunStatus(run["status"])
        if to_status not in valid_transitions.get(current, set()):
            raise ValueError(
                f"Invalid transition: {current.value} → {to_status.value}"
            )
        now = datetime.now(UTC)
        await self.db.table("scenario_runs").update({
            "status": to_status.value,
            "updated_at": now.isoformat(),
        }).eq("id", str(run_id)).execute()

    async def _append_event(
        self,
        run_id: UUID,
        event_type: str,
        step_key: str | None,
        step_idempotency_key: str | None,
    ) -> None:
        """Append an immutable event to the run's event log."""
        now = datetime.now(UTC)
        await self.db.table("scenario_events").insert({
            "id": str(uuid4()),
            "run_id": str(run_id),
            "event_type": event_type,
            "step_key": step_key,
            "step_idempotency_key": step_idempotency_key,
            "tenant_id": "gdai-default",
            "created_at": now.isoformat(),
        }).execute()
