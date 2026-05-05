"""Tests for builder FSM and security lint."""

from uuid import UUID

import pytest

from gateway.builder_fsm import BuilderFSM, BuilderState
from gateway.security_lint import (
    lint_bundle,
    lint_capability_manifest,
    lint_egress_endpoints,
    lint_env_access,
)


class TestBuilderFSM:
    def test_create_session_starts_at_intake(self) -> None:
        fsm = BuilderFSM()
        session = fsm.create_session("Pet insurance")
        assert session.state == BuilderState.intake
        assert session.domain == "Pet insurance"

    def test_valid_transitions(self) -> None:
        fsm = BuilderFSM()
        session = fsm.create_session("test")
        for state in [
            BuilderState.research, BuilderState.plan, BuilderState.approve,
            BuilderState.build, BuilderState.lint, BuilderState.preview,
            BuilderState.deploy,
        ]:
            session = fsm.transition(session.session_id, state)
            assert session.state == state

    def test_invalid_transition_raises(self) -> None:
        fsm = BuilderFSM()
        session = fsm.create_session("test")
        with pytest.raises(ValueError, match="Invalid transition"):
            fsm.transition(session.session_id, BuilderState.deploy)

    def test_requires_approval_at_approve_and_deploy(self) -> None:
        fsm = BuilderFSM()
        session = fsm.create_session("test")
        fsm.transition(session.session_id, BuilderState.research)
        fsm.transition(session.session_id, BuilderState.plan)
        session = fsm.transition(session.session_id, BuilderState.approve)
        assert fsm.requires_approval(session) is True

        fsm.transition(session.session_id, BuilderState.build)
        fsm.transition(session.session_id, BuilderState.lint)
        fsm.transition(session.session_id, BuilderState.preview)
        session = fsm.transition(session.session_id, BuilderState.deploy)
        assert fsm.requires_approval(session) is True

    def test_store_artifact(self) -> None:
        fsm = BuilderFSM()
        session = fsm.create_session("test")
        fsm.store_artifact(session.session_id, BuilderState.research, {"citations": ["ACPR Art. L113-2"]})
        assert "research" in session.artifacts


class TestSecurityLint:
    def test_capability_manifest_missing(self) -> None:
        report = lint_capability_manifest({})
        assert report.passed is False
        assert report.critical_count > 0

    def test_capability_manifest_valid(self) -> None:
        manifest = {
            "version": "1", "generated_by": "builder",
            "tools_used": ["fraud_check"], "egress_endpoints": ["api.anthropic.com"],
            "data_types_accessed": ["claim"], "human_gates": ["approve"],
        }
        report = lint_capability_manifest(manifest)
        assert report.passed is True

    def test_egress_allowlisted_domain(self) -> None:
        report = lint_egress_endpoints(["api.anthropic.com"])
        assert report.passed is True

    def test_egress_blocked_domain(self) -> None:
        report = lint_egress_endpoints(["http://evil.com/steal-data"])
        assert report.passed is False
        assert any("evil.com" in v.message for v in report.violations)

    def test_env_access_blocked(self) -> None:
        nodes = [{"id": "1", "type": "code", "name": "bad_node", "code": "import os; os.environ"}]
        report = lint_env_access(nodes)
        assert report.passed is False

    def test_env_access_clean(self) -> None:
        nodes = [{"id": "1", "type": "llm_call", "name": "triage"}]
        report = lint_env_access(nodes)
        assert report.passed is True

    def test_full_bundle_lint_passes(self) -> None:
        manifest = {
            "version": "1", "generated_by": "builder",
            "tools_used": ["fraud_check"], "egress_endpoints": ["api.anthropic.com"],
            "data_types_accessed": ["claim"], "human_gates": ["approve"],
        }
        report = lint_bundle(manifest, ["api.anthropic.com"], [{"id": "1", "type": "llm_call", "name": "triage"}])
        assert report.passed is True

    def test_full_bundle_lint_fails_on_blocked_egress(self) -> None:
        manifest = {
            "version": "1", "generated_by": "builder",
            "tools_used": [], "egress_endpoints": ["api.anthropic.com"],
            "data_types_accessed": [], "human_gates": ["approve"],
        }
        report = lint_bundle(manifest, ["http://malicious.example.com"], [])
        assert report.passed is False
