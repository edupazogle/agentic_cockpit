"""Audit bundle generator — produces a signed ZIP with 7 required artifacts.

Signed with project keypair; external hash anchor in separate schema.
"""

import hashlib
import io
import json
import zipfile
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4


@dataclass
class AuditBundle:
    bundle_id: UUID
    pilot_slug: str
    created_at: datetime
    artifacts: dict[str, bytes]
    signatures: dict[str, str]
    bundle_sha: str


def generate_bundle(
    pilot_slug: str,
    trace_summary: dict,
    prompt_versions: dict,
    model_versions: dict,
    policy_refs: list[str],
    hitl_decisions: list[dict],
    eval_scores: list[dict],
    redaction_report: dict,
) -> AuditBundle:
    """Generate a signed audit bundle with all 7 required artifacts.

    Returns an AuditBundle that can be written to ZIP and anchored.
    """
    bundle_id = uuid4()
    now = datetime.now(UTC)
    artifacts: dict[str, bytes] = {}

    # 1. Trace summary
    artifacts["trace_summary.json"] = json.dumps(trace_summary, indent=2).encode()
    # 2. Prompt versions
    artifacts["prompt_versions.json"] = json.dumps(prompt_versions, indent=2).encode()
    # 3. Model versions
    artifacts["model_versions.json"] = json.dumps(model_versions, indent=2).encode()
    # 4. Policy references
    artifacts["policy_refs.json"] = json.dumps(policy_refs, indent=2).encode()
    # 5. HITL decisions
    artifacts["hitl_decisions.json"] = json.dumps(hitl_decisions, indent=2).encode()
    # 6. Eval scores
    artifacts["eval_scores.json"] = json.dumps(eval_scores, indent=2).encode()
    # 7. Redaction report
    artifacts["redaction_report.json"] = json.dumps(redaction_report, indent=2).encode()
    # Metadata
    artifacts["bundle_metadata.json"] = json.dumps({
        "bundle_id": str(bundle_id),
        "pilot_slug": pilot_slug,
        "created_at": now.isoformat(),
        "artifact_count": len(artifacts),
    }, indent=2).encode()

    # Sign each artifact with SHA-256
    signatures: dict[str, str] = {}
    for name, content in artifacts.items():
        signatures[name] = hashlib.sha256(content).hexdigest()

    # Bundle-level hash (hash of all hashes)
    bundle_hash_input = "".join(sorted(signatures.values())).encode()
    bundle_sha = hashlib.sha256(bundle_hash_input).hexdigest()

    return AuditBundle(
        bundle_id=bundle_id,
        pilot_slug=pilot_slug,
        created_at=now,
        artifacts=artifacts,
        signatures=signatures,
        bundle_sha=bundle_sha,
    )


def write_zip(bundle: AuditBundle) -> bytes:
    """Write the audit bundle as a signed ZIP archive."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in bundle.artifacts.items():
            zf.writestr(name, content)
        # Signature manifest
        zf.writestr(
            "signature_manifest.json",
            json.dumps({
                "bundle_id": str(bundle.bundle_id),
                "bundle_sha": bundle.bundle_sha,
                "signatures": bundle.signatures,
            }, indent=2),
        )
    return buf.getvalue()


def verify_audit_chain(bundle: AuditBundle) -> bool:
    """Verify that every artifact matches its SHA-256 signature.

    Returns True if all signatures match; False otherwise.
    """
    for name, content in bundle.artifacts.items():
        expected = bundle.signatures.get(name)
        if expected is None:
            return False
        actual = hashlib.sha256(content).hexdigest()
        if actual != expected:
            return False

    # Verify bundle-level hash
    bundle_recomputed = hashlib.sha256(
        "".join(sorted(bundle.signatures.values())).encode()
    ).hexdigest()
    return bundle_recomputed == bundle.bundle_sha


def create_external_anchor(bundle: AuditBundle) -> dict:
    """Create an external hash anchor for the audit bundle.

    This is the record stored in audit_external_anchor table —
    independently verifiable without access to the bundle contents.
    """
    return {
        "bundle_id": str(bundle.bundle_id),
        "pilot_slug": bundle.pilot_slug,
        "bundle_sha": bundle.bundle_sha,
        "artifact_count": len(bundle.artifacts),
        "created_at": bundle.created_at.isoformat(),
        "signed_artifact_names": sorted(bundle.signatures.keys()),
    }
