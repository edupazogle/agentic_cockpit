"""REST endpoints for ops dashboard — dead-letter queue and health."""

from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from gateway.dependencies import get_db

router = APIRouter(prefix="/ops", tags=["ops"])


@router.get("/dead-letter")
async def list_dead_letter(db: AsyncClient = Depends(get_db)) -> dict:
    """List dead-letter items awaiting replay."""
    result = await db.table("callback_dead_letter").select("*").eq(
        "status", "pending"
    ).order("created_at", desc=True).limit(50).execute()
    return {"items": result.data, "total": len(result.data)}


@router.post("/dead-letter/{item_id}/replay")
async def replay_dead_letter(item_id: str, db: AsyncClient = Depends(get_db)) -> dict:
    """Replay a dead-letter item — retry the failed callback."""
    item = await db.table("callback_dead_letter").select("*").eq(
        "id", item_id
    ).single().execute()
    if not item.data:
        raise HTTPException(status_code=404, detail="Dead-letter item not found")

    await db.table("callback_dead_letter").update({
        "status": "replayed",
        "retries": (item.data.get("retries", 0) + 1),
    }).eq("id", item_id).execute()

    return {"status": "replayed", "item_id": item_id}
