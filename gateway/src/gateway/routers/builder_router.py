"""REST endpoints for the scenario builder — guided 8-step FSM."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from gateway.builder_fsm import BuilderFSM, BuilderState, BuilderContext

router = APIRouter(prefix="/builder", tags=["builder"])

_fsm = BuilderFSM()


@router.post("/sessions")
async def create_session(body: dict) -> dict:
    """Create a new builder session from a domain brief."""
    domain = body.get("domain", "")
    if not domain:
        raise HTTPException(status_code=400, detail="Domain brief is required")
    session = _fsm.create_session(domain)
    return {
        "session_id": str(session.session_id),
        "domain": session.domain,
        "state": session.state.value,
    }


@router.post("/sessions/{session_id}/transition")
async def transition(session_id: UUID, body: dict) -> dict:
    """Advance the builder FSM to the next state."""
    to_state = BuilderState(body.get("to_state", ""))
    try:
        session = _fsm.transition(session_id, to_state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return {
        "session_id": str(session.session_id),
        "state": session.state.value,
        "requires_approval": _fsm.requires_approval(session),
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: UUID) -> dict:
    """Get the current state and artifacts of a builder session."""
    sid = str(session_id)
    if sid not in _fsm.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = _fsm.sessions[sid]
    return {
        "session_id": str(session.session_id),
        "domain": session.domain,
        "state": session.state.value,
        "artifacts": session.artifacts,
        "requires_approval": _fsm.requires_approval(session),
        "token_cost_eur": session.token_cost_eur,
    }


@router.post("/sessions/{session_id}/lint")
async def lint_session(session_id: UUID, body: dict) -> dict:
    """Run security lint on a builder session's generated artifacts."""
    from gateway.security_lint import lint_bundle

    sid = str(session_id)
    if sid not in _fsm.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = _fsm.sessions[sid]
    report = lint_bundle(
        capability_manifest=body.get("capability_manifest", {}),
        egress_endpoints=body.get("egress_endpoints", []),
        nodes=body.get("nodes", []),
    )
    session.security_report = {
        "passed": report.passed,
        "violation_count": len(report.violations),
        "critical_count": report.critical_count,
        "violations": [
            {"rule": v.rule, "severity": v.severity, "message": v.message, "location": v.location}
            for v in report.violations
        ],
    }

    return {"passed": report.passed, "report": session.security_report}
