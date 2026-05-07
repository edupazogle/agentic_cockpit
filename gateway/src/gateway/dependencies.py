"""FastAPI dependency injection — shared resources."""

from supabase import AsyncClient, create_async_client

from gateway.settings import get_settings

settings = get_settings()


async def get_db() -> AsyncClient:
    """Return a Supabase AsyncClient scoped to the request."""
    client: AsyncClient = await create_async_client(
        settings.supabase_url, settings.supabase_service_role_key
    )
    try:
        yield client
    finally:
        await client.aclose()
