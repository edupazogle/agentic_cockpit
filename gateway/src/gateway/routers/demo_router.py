"""REST endpoints for executive demo narration and synthetic runs."""

import json

from fastapi import APIRouter, Depends
from supabase import AsyncClient

from gateway.dependencies import get_db

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/scenarios")
async def list_demo_scenarios(db: AsyncClient = Depends(get_db)) -> dict:
    """List available demo scenarios with seed run metadata."""
    result = await db.table("scenarios_demo").select(
        "scenario_key, title, domain, description, node_count, gate_count"
    ).eq("active", True).execute()
    return {"scenarios": result.data}


@router.post("/narrate")
async def generate_narration(body: dict, db: AsyncClient = Depends(get_db)) -> dict:
    """Generate board-safe narration from a Langfuse trace.

    Body: { scenario_key: str, run_id: str | null }
    Returns cached narration if available; otherwise generates via LLM.
    """
    scenario_key = body.get("scenario_key")
    run_id = body.get("run_id")

    # Check cache first
    if run_id:
        cached = await db.table("scenarios_demo").select(
            "narration"
        ).eq("scenario_key", scenario_key).single().execute()
        if cached.data and cached.data.get("narration"):
            return {"narration": cached.data["narration"], "cached": True}

    # In production: fetch Langfuse trace → generate via LLM → cache
    # Board-safe rule: no implementation details, no raw trace payloads
    sample_narration = [
        {
            "nodeLabel": "Voice agent answers",
            "text": (
                "The claim begins when the policyholder calls. "
                "Our voice agent answers immediately — no hold, no menu. "
                "It captures the incident details in natural conversation."
            ),
        },
    ]

    # Cache the generated narration
    if run_id:
        await db.table("scenarios_demo").upsert({
            "scenario_key": scenario_key,
            "narration": json.dumps(sample_narration),
            "generated_at": "now()",
        }).execute()

    return {"narration": sample_narration, "cached": False}
