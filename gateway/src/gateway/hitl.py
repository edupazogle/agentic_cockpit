"""HITL ReserveGate bridge — pause/resume with durable Supabase storage."""

from datetime import datetime, timedelta
from uuid import UUID, uuid4

from supabase import AsyncClient

from gateway.schemas.runs import RunStatus


class HitlBridge:
    """Durable bridge between Langflow HITL signals and the Supabase hitl_items table.

    On pause: writes hitl_items row, updates scenario_runs to 'waiting'.
    On resume: reads operator decision, returns structured diff for Langflow context.
    """

    def __init__(self, db: AsyncClient) -> None:
        self.db = db

    async def pause(
        self,
        run_id: UUID,
        step_key: str,
        evidence: dict,
        options: list[str],
        sla_seconds: int = 300,
    ) -> UUID:
        """Create a HITL item and pause the run."""
        hitl_id = uuid4()
        now = datetime.utcnow()
        await self.db.table("hitl_items").insert({
            "id": str(hitl_id),
            "run_id": str(run_id),
            "step_key": step_key,
            "evidence": evidence,
            "options": options,
            "sla_deadline": (now + timedelta(seconds=sla_seconds)).isoformat(),
            "status": "pending",
            "tenant_id": "gdai-default",
            "created_at": now.isoformat(),
        }).execute()

        await self.db.table("scenario_runs").update({
            "status": RunStatus.waiting.value,
        }).eq("id", str(run_id)).execute()

        return hitl_id

    async def get_pending(self, run_id: UUID) -> dict | None:
        """Get the pending HITL item for a run, if any."""
        result = await self.db.table("hitl_items").select("*").eq(
            "run_id", str(run_id)
        ).eq("status", "pending").order("created_at", desc=True).limit(1).execute()
        rows = result.data
        return rows[0] if rows else None

    async def resume(
        self, run_id: UUID, decision: str, rationale: str, operator_id: UUID | None = None
    ) -> tuple[dict, dict]:
        """Record the operator decision and return structured diff for Langflow.

        Returns (hitl_item, structured_diff) where structured_diff contains
        exactly what Langflow needs to resume contextually (per AXA-2 Spike C recommendation).
        """
        hitl = await self.get_pending(run_id)
        if not hitl:
            raise ValueError(f"No pending HITL item for run {run_id}")

        now = datetime.utcnow()
        await self.db.table("hitl_items").update({
            "decision": decision,
            "rationale": rationale,
            "operator_id": str(operator_id) if operator_id else None,
            "status": "resolved",
            "resolved_at": now.isoformat(),
        }).eq("id", hitl["id"]).execute()

        await self.db.table("scenario_runs").update({
            "status": RunStatus.running.value,
        }).eq("id", str(run_id)).execute()

        structured_diff = {
            "decision": decision,
            "rationale": rationale,
            "operator_id": str(operator_id) if operator_id else None,
            "resolved_at": now.isoformat(),
            "last_n_steps": [hitl["step_key"]],
            "run_metadata": {
                "run_id": str(run_id),
                "resumed_at": now.isoformat(),
            },
        }
        return hitl, structured_diff
