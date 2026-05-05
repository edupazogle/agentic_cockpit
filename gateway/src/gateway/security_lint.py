"""OPA/Rego-style security policy checks for generated builder bundles.

All checks are deterministic and produce structured reports. Zero violations
required for preview and deploy steps.
"""

from dataclasses import dataclass, field


@dataclass
class LintViolation:
    rule: str
    severity: str  # critical | warning
    message: str
    location: str  # which artifact/node


@dataclass
class LintReport:
    passed: bool
    violations: list[LintViolation] = field(default_factory=list)
    warnings: list[LintViolation] = field(default_factory=list)

    @property
    def critical_count(self) -> int:
        return sum(1 for v in self.violations if v.severity == "critical")


# Allowlisted egress domains for generated flows
ALLOWLISTED_DOMAINS = frozenset({
    "api.elevenlabs.io",
    "api.twilio.com",
    "api.guidewire.com",
    "api.salesforce.com",
    "api.openai.com",
    "api.anthropic.com",
    "langfuse.internal",
    "n8n.internal",
    "supabase.internal",
    "*.axa.com",
    "*.ffa-assurance.fr",
    "acpr.banque-france.fr",
    "eiopa.europa.eu",
})

CAPABILITY_MANIFEST_REQUIRED_FIELDS = frozenset({
    "version", "generated_by", "tools_used", "egress_endpoints",
    "data_types_accessed", "human_gates",
})


def lint_capability_manifest(manifest: dict) -> LintReport:
    violations: list[LintViolation] = []
    warnings: list[LintViolation] = []

    if not manifest:
        violations.append(LintViolation(
            rule="CAP-001",
            severity="critical",
            message="Capability manifest is missing or empty",
            location="capability_manifest.json",
        ))
        return LintReport(passed=False, violations=violations, warnings=warnings)

    for field in CAPABILITY_MANIFEST_REQUIRED_FIELDS:
        if field not in manifest:
            violations.append(LintViolation(
                rule="CAP-002",
                severity="critical",
                message=f"Missing required field: {field}",
                location="capability_manifest.json",
            ))

    return LintReport(
        passed=len(violations) == 0,
        violations=violations,
        warnings=warnings,
    )


def lint_egress_endpoints(endpoints: list[str]) -> LintReport:
    violations: list[LintViolation] = []
    warnings: list[LintViolation] = []

    for endpoint in endpoints:
        allowed = any(
            ep == endpoint or (ep.startswith("*.") and endpoint.endswith(ep[1:]))
            for ep in ALLOWLISTED_DOMAINS
        )
        if not allowed:
            violations.append(LintViolation(
                rule="EGRESS-001",
                severity="critical",
                message=f"Egress to non-allowlisted domain: {endpoint}",
                location=f"egress:{endpoint}",
            ))

    return LintReport(
        passed=len(violations) == 0,
        violations=violations,
        warnings=warnings,
    )


def lint_env_access(nodes: list[dict]) -> LintReport:
    violations: list[LintViolation] = []
    warnings: list[LintViolation] = []

    for node in nodes:
        if node.get("type") == "code" and "env" in str(node.get("code", "")).lower():
            violations.append(LintViolation(
                rule="ENV-001",
                severity="critical",
                message=f"Generated code node '{node.get('name')}' attempts env access",
                location=f"node:{node.get('id', 'unknown')}",
            ))

    return LintReport(
        passed=len(violations) == 0,
        violations=violations,
        warnings=warnings,
    )


def lint_bundle(
    capability_manifest: dict,
    egress_endpoints: list[str],
    nodes: list[dict],
) -> LintReport:
    """Run all security lint checks on a generated bundle."""
    cap_report = lint_capability_manifest(capability_manifest)
    egress_report = lint_egress_endpoints(egress_endpoints)
    env_report = lint_env_access(nodes)

    all_violations = (
        cap_report.violations + egress_report.violations + env_report.violations
    )
    all_warnings = (
        cap_report.warnings + egress_report.warnings + env_report.warnings
    )

    return LintReport(
        passed=len(all_violations) == 0,
        violations=all_violations,
        warnings=all_warnings,
    )
