"""Tests for audit bundle generation, signing, and verification."""

from gateway.audit_bundle import (
    create_external_anchor,
    generate_bundle,
    verify_audit_chain,
    write_zip,
)


class TestAuditBundle:
    def test_generate_bundle_has_7_artifacts(self) -> None:
        bundle = generate_bundle(
            pilot_slug="test",
            trace_summary={},
            prompt_versions={},
            model_versions={},
            policy_refs=[],
            hitl_decisions=[],
            eval_scores=[],
            redaction_report={},
        )
        # 7 artifacts + 1 metadata = 8 files inside
        assert len(bundle.artifacts) == 8

    def test_verify_audit_chain_passes(self) -> None:
        bundle = generate_bundle(
            pilot_slug="property-fast-track",
            trace_summary={"steps": 14, "duration_s": 13.2},
            prompt_versions={"triage": "v3"},
            model_versions={"primary": "claude-opus-4-7"},
            policy_refs=["RGPD Art. 22"],
            hitl_decisions=[{"gate": "A", "decision": "Approve"}],
            eval_scores=[{"case_id": "G-001", "score": 0.98}],
            redaction_report={"emails": 3},
        )
        assert verify_audit_chain(bundle) is True

    def test_verify_audit_chain_fails_on_tamper(self) -> None:
        bundle = generate_bundle(
            pilot_slug="test",
            trace_summary={},
            prompt_versions={},
            model_versions={},
            policy_refs=[],
            hitl_decisions=[],
            eval_scores=[],
            redaction_report={},
        )
        # Tamper with a signature
        bundle.signatures["trace_summary.json"] = "deadbeef"
        assert verify_audit_chain(bundle) is False

    def test_write_zip_produces_bytes(self) -> None:
        bundle = generate_bundle(
            pilot_slug="test",
            trace_summary={},
            prompt_versions={},
            model_versions={},
            policy_refs=[],
            hitl_decisions=[],
            eval_scores=[],
            redaction_report={},
        )
        zip_bytes = write_zip(bundle)
        assert len(zip_bytes) > 0
        assert zip_bytes[:2] == b"PK"  # ZIP magic bytes

    def test_create_external_anchor(self) -> None:
        bundle = generate_bundle(
            pilot_slug="test",
            trace_summary={},
            prompt_versions={},
            model_versions={},
            policy_refs=[],
            hitl_decisions=[],
            eval_scores=[],
            redaction_report={},
        )
        anchor = create_external_anchor(bundle)
        assert anchor["bundle_sha"] == bundle.bundle_sha
        assert anchor["pilot_slug"] == "test"
        assert "signed_artifact_names" in anchor

    def test_bundle_sha_is_computed_consistently(self) -> None:
        """Bundle SHA is derived from artifact hashes and verifiable."""
        bundle = generate_bundle(
            pilot_slug="test",
            trace_summary={"a": 1},
            prompt_versions={"b": "v2"},
            model_versions={"c": "v1"},
            policy_refs=["d"],
            hitl_decisions=[],
            eval_scores=[],
            redaction_report={},
        )
        assert len(bundle.bundle_sha) == 64  # SHA-256 hex digest
        assert verify_audit_chain(bundle) is True  # hash is internally consistent
