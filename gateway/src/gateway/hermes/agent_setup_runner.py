#!/usr/bin/env python3
"""Programmatic runner for hermes/agent_setup skill.

Invoked by module_composer during ship phase 2 (Composition) to auto-generate:
- synthdata patches
- tool function stubs
- router templates
- system prompts
- golden test cases
- ElevenLabs agent config JSON

Kept in sync with the human-readable agent_setup skill via shared Jinja templates.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

SKILL_ROOT = Path(__file__).resolve().parents[4] / ".agents" / "skills" / "hermes" / "agent_setup"


@dataclass
class AgentSetupOutput:
    uc_code: str
    agent_name: str
    system_prompt: str
    tool_functions: list[str]
    router_code: str
    golden_cases: list[dict[str, Any]]
    elevenlabs_config: dict[str, Any]
    errors: list[str]


def run_agent_setup(
    *,
    uc_code: str,
    agent_name: str,
    risk_level: str,
    kyc_level: str,
    has_payment: bool,
    tools: list[dict[str, Any]],
    flow_steps: list[dict[str, Any]],
    escalation_triggers: list[str],
    golden_case_count: int = 40,
) -> AgentSetupOutput:
    """Execute the agent_setup skill programmatically.

    Returns a structured output that module_composer can write to the
    repo_change_set. The skill markdown remains the human-readable canonical doc.
    """
    errors: list[str] = []

    if risk_level not in ('low', 'medium', 'high'):
        errors.append(f"Unknown risk_level: {risk_level}")
    if kyc_level not in ('standard', 'strong'):
        errors.append(f"Unknown kyc_level: {kyc_level}")

    min_golden = {'low': 40, 'medium': 50, 'high': 60}.get(risk_level, 40)
    if golden_case_count < min_golden:
        errors.append(
            f"Golden cases {golden_case_count} below minimum {min_golden} for {risk_level}"
        )

    system_prompt = _render_system_prompt(
        agent_name=agent_name, uc_code=uc_code, risk_level=risk_level,
        kyc_level=kyc_level, has_payment=has_payment, flow_steps=flow_steps,
        escalation_triggers=escalation_triggers,
    )

    return AgentSetupOutput(
        uc_code=uc_code,
        agent_name=agent_name,
        system_prompt=system_prompt,
        tool_functions=[_render_tool_stub(t) for t in tools],
        router_code=_render_router(uc_code=uc_code, tools=tools),
        golden_cases=[_make_golden_case(i, uc_code, flow_steps) for i in range(golden_case_count)],
        elevenlabs_config={
            "agent_name": agent_name,
            "tts": {"model_id": "eleven_v3_conversational"},
            "tools": [t.get("name", f"tool_{i}") for i, t in enumerate(tools)],
        },
        errors=errors,
    )


def _render_system_prompt(**kwargs: Any) -> str:
    lines = [
        f"[SYSTEM · {kwargs['agent_name']} · UC: {kwargs['uc_code']}]",
        (
            f"Risk level: {kwargs['risk_level']} | KYC: {kwargs['kyc_level']}"
            f" | Payment: {kwargs['has_payment']}"
        ),
        "",
        "Flow steps:",
    ]
    for i, step in enumerate(kwargs.get('flow_steps', [])):
        lines.append(f"  {i+1}. {step.get('name', f'step_{i}')}")
    lines.append("")
    lines.append("Escalation triggers:")
    for t in kwargs.get('escalation_triggers', []):
        lines.append(f"  - {t}")
    return "\n".join(lines)


def _render_tool_stub(tool: dict[str, Any]) -> str:
    name = tool.get('name', 'unnamed_tool')
    desc = tool.get('description', '')
    return f"def {name}(**kwargs):\n    \"\"\"{desc}\"\"\"\n    pass"


def _render_router(*, uc_code: str, tools: list[dict[str, Any]]) -> str:
    tool_names = [t.get('name', f'tool_{i}') for i, t in enumerate(tools)]
    lines = [
        f"# Router for {uc_code}",
        "from fastapi import APIRouter",
        "",
        f"router = APIRouter(prefix='/tools/{uc_code.lower()}')",
    ]
    for name in tool_names:
        lines.append(f"# POST /{name} — stub")
    return "\n".join(lines)


def _make_golden_case(i: int, uc_code: str, flow_steps: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": f"gc_{uc_code}_{i:04d}",
        "input": {"caller_utterance": f"golden test case {i}"},
        "expected_flow": [s.get('name', f'step_{j}') for j, s in enumerate(flow_steps)],
        "expected_tools": [],
        "expected_escalation": False,
    }
