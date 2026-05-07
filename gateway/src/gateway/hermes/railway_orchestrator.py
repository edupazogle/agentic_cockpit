"""Railway orchestrator — deploy gateway services via Railway API."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass
class DeployResult:
    success: bool
    service_url: str | None
    deployment_id: str | None
    error: str | None


def deploy_gateway(
    *,
    pilot_id: UUID,
    module_id: UUID,
    tenant_id: str,
    dry_run: bool = True,
) -> DeployResult:
    """Deploy a module's gateway to Railway.

    In S3, this is wired to the Railway MCP server. For now it returns a
    structured result that callers can use to gate promotion.
    """
    if dry_run:
        return DeployResult(
            success=True,
            service_url="https://agentic-voice-gateway.railway.app (dry-run)",
            deployment_id="dry-run-0000",
            error=None,
        )

    return DeployResult(
        success=False,
        service_url=None,
        deployment_id=None,
        error="Railway deploy not yet wired — use Railway MCP in production S3",
    )
