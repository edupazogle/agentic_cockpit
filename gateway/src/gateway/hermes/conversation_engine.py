from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

PROMPTS_ROOT = Path(__file__).resolve().parents[4] / "prompts" / "compagnon"

VALID_LEVELS = {'l0_build', 'l1_solo_test', 'l2_sandbox'}
VALID_MOVEMENTS = {'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'}

_MOVEMENT_FILES = {
    'i': 'i_personas.txt',
    'ii': 'ii_research.txt',
    'iii': 'iii_plan.txt',
    'iv': 'iv_business_case.txt',
    'v': 'v_synth_seed.txt',
    'vi': 'vi_charter.txt',
    'vii': 'vii_rehearsal.txt',
    'viii': 'viii_summary.txt',
}

_MOVEMENT_TAGS = {
    'i': 'STEP1_PERSONAS',
    'ii': 'STEP2_RESEARCH',
    'iii': 'STEP3_PLAN',
    'iv': 'STEP4_BUSINESS',
    'v': 'STEP5_SYNTH',
    'vi': 'STEP6_CHARTER',
    'vii': 'STEP7_REHEARSAL',
    'viii': 'STEP8_SUMMARY',
}

_LEVEL_TAGS = {
    'l0_build': 'L0_BUILD',
    'l1_solo_test': 'L1_SOLO_TEST',
    'l2_sandbox': 'L2_SANDBOX',
}


@dataclass
class AssembledPrompt:
    system: str
    messages: list[dict]


def _read(path: Path) -> str:
    return path.read_text() if path.exists() else f"[MISSING: {path.name}]"


def assemble_prompt(
    *,
    level: str,
    movement: str | None,
    recent_messages: list[dict],
    artifacts_summary: str,
    pane_state: dict,
) -> AssembledPrompt:
    if level not in VALID_LEVELS:
        raise ValueError(f"unknown level: {level}")
    if movement is not None and movement not in VALID_MOVEMENTS:
        raise ValueError(f"unknown movement: {movement}")

    charter = _read(PROMPTS_ROOT / "charter.txt")
    level_overlay = _read(PROMPTS_ROOT / "level" / f"{level}.txt")
    movement_overlay = ''
    if movement:
        mf = _MOVEMENT_FILES.get(movement, '')
        if mf:
            movement_overlay = _read(PROMPTS_ROOT / "movement" / mf)

    tag_block = f"\n[CHARTER] [{_LEVEL_TAGS[level]}]"
    if movement:
        tag_block += f" [{_MOVEMENT_TAGS.get(movement, '')}]"

    context = (
        f"\n\n[CONTEXT]\nartifacts_summary: {artifacts_summary}\n"
        f"pane_state: {pane_state}\n"
    )

    system = (
        f"{tag_block}\n\n{charter}\n\n{level_overlay}\n\n{movement_overlay}{context}"
    )
    return AssembledPrompt(system=system, messages=list(recent_messages))
