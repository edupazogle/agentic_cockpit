"""Tenant resolution — resolves tenant_id for each request."""
from __future__ import annotations

import structlog
from fastapi import Header, HTTPException, Request

from gateway.settings import get_settings

logger = structlog.get_logger()


def resolve_tenant_id(
    request: Request,
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
) -> str:
    """
    Resolve the tenant_id for this request.

    In the single-tenant MVP, this always returns 'gdai-default'.
    The header is accepted but validated against the allowed set.

    IMPORTANT: The tenant fallback to a default is LOCAL/DEV ONLY.
    In staging/production, a missing or unknown tenant header must
    return 400 to prevent cross-tenant data bleed.
    """
    settings = get_settings()

    # Accepted tenant IDs — extend when multi-tenant is introduced
    known_tenants: set[str] = {"gdai-default"}

    if x_tenant_id is not None:
        if x_tenant_id not in known_tenants:
            logger.warning("unknown_tenant", tenant_id=x_tenant_id, path=request.url.path)
            raise HTTPException(status_code=400, detail="Unknown tenant")
        return x_tenant_id

    # Fallback: allowed only in local/dev
    if not settings.is_local:
        logger.warning("missing_tenant_header", path=request.url.path, env=settings.app_env)
        raise HTTPException(status_code=400, detail="X-Tenant-Id header required")

    return str(settings.tenant_id_default)
