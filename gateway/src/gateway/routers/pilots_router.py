"""REST endpoints for pilot CRUD and listing."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from gateway.dependencies import get_db

router = APIRouter(prefix="/pilots", tags=["pilots"])


@router.get("")
async def list_pilots(db: AsyncClient = Depends(get_db)) -> dict:
    """List all pilots with last-run summary."""
    result = await db.table("pilots").select("*").order("updated_at", desc=True).execute()
    return {"pilots": result.data, "total": len(result.data)}


@router.get("/{pilot_id}")
async def get_pilot(pilot_id: str, db: AsyncClient = Depends(get_db)) -> dict:
    """Get a pilot with its last 20 runs and HITL queue status."""
    pilot = await db.table("pilots").select("*").eq("slug", pilot_id).single().execute()
    if not pilot.data:
        raise HTTPException(status_code=404, detail="Pilot not found")

    runs = await db.table("scenario_runs").select("*").eq(
        "pilot_id", pilot_id
    ).order("created_at", desc=True).limit(20).execute()

    hitl_count = await db.table("hitl_items").select(
        "id", count="exact"
    ).eq("status", "pending").execute()

    return {
        "pilot": pilot.data,
        "runs": runs.data,
        "hitl_pending": hitl_count.count if hasattr(hitl_count, "count") else 0,
    }


@router.post("", status_code=201)
async def create_pilot(body: dict, db: AsyncClient = Depends(get_db)) -> dict:
    """Create a new pilot draft."""
    pilot_id = str(uuid4())
    row = {
        "id": pilot_id,
        "slug": body["slug"],
        "domain": body.get("domain", "motor-fnol"),
        "level": "L0",
        "tenant_id": "gdai-default",
    }
    await db.table("pilots").insert(row).execute()
    return {"pilot": row}
