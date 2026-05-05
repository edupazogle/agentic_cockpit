"""REST endpoints for HITL queue and decision management."""


from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from gateway.dependencies import get_db

router = APIRouter(prefix="/hitl", tags=["hitl"])


@router.get("")
async def list_hitl_queue(
    status: str = "pending",
    db: AsyncClient = Depends(get_db),
) -> dict:
    """List HITL items with priority sort (SLA deadline ascending)."""
    result = await db.table("hitl_items").select("*").eq(
        "status", status
    ).order("sla_deadline", asc=True).execute()
    return {"items": result.data, "total": len(result.data)}


@router.get("/{item_id}")
async def get_hitl_item(item_id: str, db: AsyncClient = Depends(get_db)) -> dict:
    """Get a single HITL item with evidence and run context."""
    item = await db.table("hitl_items").select("*").eq("id", item_id).single().execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="HITL item not found")

    run = await db.table("scenario_runs").select("*").eq(
        "id", item.data.get("run_id")
    ).single().execute()

    return {"item": item.data, "run": run.data}


@router.post("/{item_id}/decision")
async def submit_decision(
    item_id: str,
    body: dict,
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Submit an operator decision on a HITL item.

    Body: { decision: str, rationale: str, operator_id: str | null }
    """
    item = await db.table("hitl_items").select("*").eq("id", item_id).single().execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="HITL item not found")
    if item.data["status"] != "pending":
        raise HTTPException(status_code=400, detail="HITL item already resolved")

    await db.table("hitl_items").update({
        "decision": body["decision"],
        "rationale": body.get("rationale", ""),
        "operator_id": body.get("operator_id"),
        "status": "resolved",
    }).eq("id", item_id).execute()

    await db.table("scenario_runs").update({
        "status": "running",
    }).eq("id", item.data["run_id"]).execute()

    return {
        "status": "resolved",
        "item_id": item_id,
        "decision": body["decision"],
    }
