"""Langflow runtime client with timeout, retry, and idempotency-key forwarding."""


import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from gateway.settings import get_settings

settings = get_settings()


class LangflowClient:
    """Wraps Langflow runtime API with idempotency and retry."""

    def __init__(self) -> None:
        self.base_url = settings.langflow_api_url.rstrip("/")
        self.timeout = httpx.Timeout(settings.langflow_timeout_s)
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url, timeout=self.timeout
            )
        return self._client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4.0),
    )
    async def run_step(
        self,
        flow_id: str,
        step_key: str,
        step_idempotency_key: str,
        context: dict,
    ) -> dict:
        """Execute a single Langflow flow step with idempotency protection.

        Returns the step output dict. On HITL signal, output includes
        _signal: "requires_human_review" with evidence and options.
        """
        client = await self._get_client()
        payload = {
            "step_key": step_key,
            "step_idempotency_key": step_idempotency_key,
            "context": context,
        }
        headers = {
            "X-Idempotency-Key": step_idempotency_key,
            "Authorization": f"Bearer {settings.langflow_api_key}",
        }
        resp = await client.post(
            f"/api/v1/run/{flow_id}/step",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def run_flow(
        self,
        flow_id: str,
        inputs: dict,
    ) -> dict:
        """Start a new Langflow flow run. Returns run metadata."""
        client = await self._get_client()
        resp = await client.post(
            f"/api/v1/run/{flow_id}",
            json={"inputs": inputs},
            headers={"Authorization": f"Bearer {settings.langflow_api_key}"},
        )
        resp.raise_for_status()
        return resp.json()

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None
