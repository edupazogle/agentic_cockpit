"""PostHog feature-flag evaluation for orchestrator selection.

Sticky per claim_id. Falls back to 'n8n' when PostHog is unavailable.
"""

import hashlib
import struct
from typing import Any

from gateway.schemas.runs import Orchestrator
from gateway.settings import get_settings

settings = get_settings()


class PostHogFlags:
    """Server-side feature flag evaluation with deterministic fallback."""

    FLAG_KEY = "pf_orchestrator"

    def __init__(self) -> None:
        self._client: Any = None  # posthog.Client when available

    async def _ensure_client(self) -> None:
        if self._client is None and settings.posthog_api_key:
            try:
                import posthog  # noqa: F811

                self._client = posthog  # type: ignore[assignment]
            except ImportError:
                pass

    async def get_orchestrator(
        self, claim_id: str, session_header: str | None = None
    ) -> Orchestrator:
        """Return the orchestrator to use for this claim.

        Priority: explicit session header > PostHog flag > deterministic fallback.
        """
        if session_header == "langflow":
            return Orchestrator.langflow
        if session_header == "n8n":
            return Orchestrator.n8n

        await self._ensure_client()
        if self._client and settings.posthog_api_key:
            try:
                result = self._client.get_feature_flag(
                    self.FLAG_KEY,
                    distinct_id=claim_id,
                )
                if isinstance(result, str):
                    return Orchestrator(result)
            except Exception:
                pass

        return self._deterministic_fallback(claim_id)

    @staticmethod
    def _deterministic_fallback(claim_id: str) -> Orchestrator:
        """Deterministic fallback when PostHog is unavailable.

        For canary: 5% Langflow, 95% n8n. Hash ensures same claim always
        routes the same way regardless of gateway restart.
        """
        h = hashlib.sha256(claim_id.encode()).digest()
        bucket = struct.unpack(">I", h[:4])[0] % 100
        if bucket < settings.langflow_canary_pct:
            return Orchestrator.langflow
        return Orchestrator.n8n
