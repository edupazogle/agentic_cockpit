"""ElevenLabs orchestrator — register agents and tools via ElevenLabs ConvAI API."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ELAgentResult:
    success: bool
    agent_id: str | None
    error: str | None
    tools_linked: int


def register_agent(
    *,
    agent_name: str,
    system_prompt: str,
    tts_model_id: str = "eleven_v3_conversational",
    tools: list[dict] | None = None,
    dry_run: bool = True,
) -> ELAgentResult:
    """Register an ElevenLabs ConvAI agent with tools.

    In S3, this is wired to the ElevenLabs API. For now it validates the
    hard constraints and returns a structured result.
    """
    if tts_model_id != "eleven_v3_conversational":
        return ELAgentResult(
            success=False, agent_id=None,
            error="TTS must be eleven_v3_conversational", tools_linked=0,
        )

    if len(system_prompt) < 2000:
        return ELAgentResult(
            success=False, agent_id=None,
            error=f"System prompt too short ({len(system_prompt)} chars, min 2000)", tools_linked=0,
        )

    if dry_run:
        return ELAgentResult(
            success=True,
            agent_id="agent_dry_run_0000",
            error=None,
            tools_linked=len(tools or []),
        )

    return ELAgentResult(
        success=False, agent_id=None,
        error="ElevenLabs API not yet wired — use in production S3", tools_linked=0,
    )


def cleanup_agent(*, agent_id: str, dry_run: bool = True) -> bool:
    """Remove an ElevenLabs agent and its linked tools. Idempotent."""
    if dry_run:
        return True
    return False  # Not yet wired
