"""Builder FSM — deterministic 8-step pipeline for scenario composition.

intake → research → plan → approve → build → lint → preview → deploy

Each step produces versioned artifacts. Security lint runs at the lint step.
Human approval required at approve and deploy steps (per G0→G1 gate policy).
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4


class BuilderState(StrEnum):
    intake = "intake"
    research = "research"
    plan = "plan"
    approve = "approve"
    build = "build"
    lint = "lint"
    preview = "preview"
    deploy = "deploy"


VALID_TRANSITIONS: dict[BuilderState, set[BuilderState]] = {
    BuilderState.intake: {BuilderState.research},
    BuilderState.research: {BuilderState.plan},
    BuilderState.plan: {BuilderState.approve},
    BuilderState.approve: {BuilderState.build, BuilderState.plan},
    BuilderState.build: {BuilderState.lint},
    BuilderState.lint: {BuilderState.preview, BuilderState.build},
    BuilderState.preview: {BuilderState.deploy, BuilderState.build},
    BuilderState.deploy: set(),
}


@dataclass
class BuilderSession:
    session_id: UUID
    domain: str
    state: BuilderState
    artifacts: dict[str, dict] = field(default_factory=dict)
    security_report: dict | None = None
    token_cost_eur: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class BuilderContext:
    domain_brief: str
    insurance_signals: list[str] = field(default_factory=list)
    research_citations: list[dict] = field(default_factory=list)
    flow_plan: list[dict] = field(default_factory=list)
    generated_flow: dict | None = None
    lint_results: dict | None = None
    preview_run_id: str | None = None


class BuilderFSM:
    """Deterministic state machine for the scenario builder pipeline."""

    def __init__(self) -> None:
        self.sessions: dict[str, BuilderSession] = {}

    def create_session(self, domain: str) -> BuilderSession:
        session = BuilderSession(session_id=uuid4(), domain=domain, state=BuilderState.intake)
        self.sessions[str(session.session_id)] = session
        return session

    def transition(self, session_id: UUID, to_state: BuilderState) -> BuilderSession:
        session = self.sessions[str(session_id)]
        if to_state not in VALID_TRANSITIONS.get(session.state, set()):
            raise ValueError(
                f"Invalid transition: {session.state.value} → {to_state.value}"
            )
        session.state = to_state
        session.updated_at = datetime.now(UTC)
        return session

    def store_artifact(
        self, session_id: UUID, step: BuilderState, data: dict
    ) -> None:
        session = self.sessions[str(session_id)]
        session.artifacts[step.value] = data
        session.updated_at = datetime.now(UTC)

    def requires_approval(self, session: BuilderSession) -> bool:
        return session.state in (BuilderState.approve, BuilderState.deploy)
