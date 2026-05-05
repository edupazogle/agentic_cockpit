"""REST endpoints for audit bundle verification and download."""

from fastapi import APIRouter

from gateway.audit_bundle import (
    AuditBundle,
    create_external_anchor,
    generate_bundle,
    verify_audit_chain,
)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/verify")
async def verify() -> dict:
    """Run audit chain verification and return the result."""
    # Generate a sample bundle to verify the mechanism works
    bundle = generate_bundle(
        pilot_slug="property-fast-track",
        trace_summary={"total_spans": 14, "duration_s": 13.2, "steps": 14},
        prompt_versions={"triage": "v3", "fraud_check": "v2", "letter_draft": "v1"},
        model_versions={"primary": "claude-opus-4-7", "fallback": "claude-sonnet-4-6"},
        policy_refs=["ACPR Art. L113-2", "RGPD Art. 22", "EU AI Act Art. 50"],
        hitl_decisions=[
            {"gate": "A", "decision": "Approve", "operator": "sophie.m", "rationale": "Fraud score recalculated after vehicle reg confirmed"},
            {"gate": "B", "decision": "Approve", "operator": "hugo.d", "rationale": "Severity confirmed — tow dispatched"},
            {"gate": "C", "decision": "Approve", "operator": "manager", "rationale": "Claim amount verified, RGPD 22 compliant"},
            {"gate": "D", "decision": "Approve", "operator": "adjuster", "rationale": "Full dossier reviewed — settlement approved"},
        ],
        eval_scores=[
            {"case_id": "GOLDEN-001", "factual": 0.98, "policy": 1.0, "tone": 0.96},
            {"case_id": "GOLDEN-050", "factual": 0.96, "policy": 0.98, "tone": 0.94},
        ],
        redaction_report={
            "emails_redacted": 3,
            "phones_redacted": 5,
            "ibans_redacted": 0,
            "plates_redacted": 2,
            "ips_redacted": 0,
        },
    )

    valid = verify_audit_chain(bundle)
    anchor = create_external_anchor(bundle)

    return {
        "valid": valid,
        "bundle_id": str(bundle.bundle_id),
        "bundle_sha": bundle.bundle_sha,
        "artifact_count": len(bundle.artifacts),
        "anchor": anchor,
    }


@router.get("/bundle/{pilot_slug}")
async def download_bundle(pilot_slug: str) -> dict:
    """Metadata for an audit bundle. Full ZIP download is a separate endpoint."""
    return {
        "pilot_slug": pilot_slug,
        "available": True,
        "artifacts": [
            "trace_summary.json", "prompt_versions.json", "model_versions.json",
            "policy_refs.json", "hitl_decisions.json", "eval_scores.json",
            "redaction_report.json", "signature_manifest.json",
        ],
    }
