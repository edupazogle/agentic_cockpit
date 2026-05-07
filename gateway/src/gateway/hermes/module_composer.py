"""Module composer — assembles all artifacts for a module into a ship-ready bundle."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID


@dataclass
class ComposedModule:
    module_id: UUID
    uc_code: str
    agent_name: str
    module_spec: dict[str, Any]
    synthdata_patch: str | None
    tools: list[dict[str, Any]]
    router_template: str | None
    prompt_system: str | None
    golden_cases: list[dict[str, Any]]
    elevenlabs_config: dict[str, Any]
    errors: list[str]


def compose_module(db, *, module_id: UUID, pilot_id: UUID, tenant_id: str) -> ComposedModule:
    """Read all artifacts for a module and assemble into a ship-ready bundle."""
    mod_row = db.execute(
        "select id, uc_code, agent_name, module_spec, risk_level, kyc_level, has_payment "
        "from pilot_module where id=%s and pilot_id=%s and tenant_id=%s",
        (module_id, pilot_id, tenant_id),
    ).fetchone()

    if not mod_row:
        raise ValueError(f"Module {module_id} not found")

    mid, uc_code, agent_name, module_spec, risk_level, kyc_level, has_payment = mod_row
    errors: list[str] = []

    artifacts = db.execute(
        "select kind, content from pilot_artifact "
        "where pilot_id=%s and (module_id=%s or module_id is null) and retired_at is null "
        "order by kind, version desc",
        (pilot_id, module_id),
    ).fetchall()

    art_by_kind: dict[str, Any] = {}
    for kind, content in artifacts:
        if kind not in art_by_kind:
            art_by_kind[kind] = content

    golden_cases = art_by_kind.get('golden_cases', [])
    if isinstance(golden_cases, dict):
        golden_cases = golden_cases.get('cases', [])

    tools = art_by_kind.get('tools_inventory', [])
    if isinstance(tools, dict):
        tools = tools.get('tools', [])

    return ComposedModule(
        module_id=mid,
        uc_code=uc_code,
        agent_name=agent_name or uc_code,
        module_spec=module_spec or {},
        synthdata_patch=None,
        tools=tools,
        router_template=None,
        prompt_system=art_by_kind.get('system_prompt'),
        golden_cases=golden_cases,
        elevenlabs_config={
            "agent_name": agent_name or uc_code,
            "tts": {"model_id": "eleven_v3_conversational"},
            "tools": [],
        },
        errors=errors,
    )
