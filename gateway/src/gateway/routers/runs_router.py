"""REST endpoints for scenario run orchestration."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header
from supabase import AsyncClient

from gateway.dependencies import get_db
from gateway.runs import RunManager
from gateway.schemas.runs import CreateRunRequest, ResumeRequest, RunResponse

router = APIRouter(prefix="/runs", tags=["runs"])


def _get_run_manager(db: AsyncClient = Depends(get_db)) -> RunManager:
    return RunManager(db)


@router.post("", response_model=RunResponse, status_code=201)
async def create_run(
    req: CreateRunRequest,
    x_session: str | None = Header(None, alias="X-Session"),
    mgr: RunManager = Depends(_get_run_manager),
) -> RunResponse:
    """Create a new scenario run. Orchestrator selected via PostHog flag or explicit header."""
    return await mgr.create_run(req, session_header=x_session)


@router.post("/{run_id}/cancel", status_code=200)
async def cancel_run(
    run_id: UUID,
    mgr: RunManager = Depends(_get_run_manager),
) -> dict:
    """Cancel a queued or running run."""
    await mgr.cancel_run(run_id)
    return {"status": "cancelled", "run_id": str(run_id)}


@router.post("/{run_id}/resume", status_code=200)
async def resume_run(
    run_id: UUID,
    req: ResumeRequest,
    mgr: RunManager = Depends(_get_run_manager),
) -> dict:
    """Resume a run paused at a HITL gate with the operator's decision."""
    diff = await mgr.resume_run(
        run_id=run_id,
        decision=req.decision,
        rationale=req.rationale,
    )
    return {"status": "resumed", "run_id": str(run_id), "context": diff}
