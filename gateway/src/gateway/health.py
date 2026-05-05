"""Health check endpoint and dependency probes."""
from __future__ import annotations

import httpx
import structlog
from fastapi import APIRouter

from gateway.settings import get_settings

router = APIRouter()
logger = structlog.get_logger()


async def _probe(url: str, timeout: float = 2.0) -> str:
    if not url:
        return "not_configured"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(url)
            return "ok" if r.is_success else f"http_{r.status_code}"
    except Exception as exc:
        logger.debug("health_probe_failed", url=url, error=str(exc))
        return "unreachable"


@router.get("/healthz", tags=["observability"])
async def healthz() -> dict[str, object]:
    """
    Liveness + shallow dependency probe.

    Returns 200 always (so Railway/load-balancer health checks pass);
    callers inspect the `deps` map for degraded state.
    """
    settings = get_settings()

    supabase_probe = await _probe(f"{settings.supabase_url}/rest/v1/")
    langflow_probe = await _probe(f"{settings.langflow_url}/api/v1/health")
    n8n_probe = await _probe(f"{settings.n8n_base_url}/healthz")
    langfuse_probe = await _probe(f"{settings.langfuse_host}/api/public/health")
    otel_probe = await _probe(settings.otel_collector_health_url)
    chatwoot_probe = (
        await _probe(f"{settings.chatwoot_base_url}/auth/sign_in")
        if settings.chatwoot_base_url
        else "not_configured"
    )

    all_deps = {
        "supabase": supabase_probe,
        "langflow": langflow_probe,
        "n8n": n8n_probe,
        "langfuse": langfuse_probe,
        "otel_collector": otel_probe,
        "chatwoot": chatwoot_probe,
    }

    return {
        "ok": True,
        "service": "agent-gateway",
        "version": settings.app_version,
        "env": settings.app_env,
        "deps": all_deps,
    }


@router.get("/version", tags=["observability"])
async def version() -> dict[str, str]:
    settings = get_settings()
    return {
        "service": "agent-gateway",
        "version": settings.app_version,
        "env": settings.app_env,
    }
