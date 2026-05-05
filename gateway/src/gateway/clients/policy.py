"""Timeout, retry, and circuit-breaker policy for MCP tool calls."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    recovery_timeout_s: float = 30.0
    half_open_max: int = 2

    _failures: int = 0
    _last_failure: datetime | None = None
    _state: str = "closed"  # closed | open | half_open

    def record_success(self) -> None:
        if self._state == "half_open":
            self._state = "closed"
        self._failures = 0
        self._last_failure = None

    def record_failure(self) -> None:
        self._failures += 1
        self._last_failure = datetime.utcnow()
        if self._failures >= self.failure_threshold:
            self._state = "open"

    def allow_request(self) -> bool:
        if self._state == "closed":
            return True
        if self._state == "open":
            if self._last_failure and (
                (datetime.utcnow() - self._last_failure).total_seconds()
                >= self.recovery_timeout_s
            ):
                self._state = "half_open"
                return True
            return False
        return True  # half_open


@dataclass
class ToolPolicy:
    timeout_s: float = 30.0
    max_retries: int = 2
    retry_backoff_s: float = 1.0
    breaker: CircuitBreaker = field(default_factory=CircuitBreaker)


# Per-tool policy defaults
TOOL_POLICIES: dict[str, ToolPolicy] = {
    "guidewire_policy_lookup": ToolPolicy(timeout_s=10.0, max_retries=1),
    "claims_facade": ToolPolicy(timeout_s=30.0, max_retries=2),
    "document_extract": ToolPolicy(timeout_s=60.0, max_retries=1),
    "fraud_score": ToolPolicy(timeout_s=15.0, max_retries=1),
    "twilio_send_sms": ToolPolicy(timeout_s=10.0, max_retries=1),
    "tow_dispatch": ToolPolicy(timeout_s=30.0, max_retries=2),
}


def get_tool_policy(tool_name: str) -> ToolPolicy:
    return TOOL_POLICIES.get(tool_name, ToolPolicy())
