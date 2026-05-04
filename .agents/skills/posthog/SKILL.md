---
name: posthog
description: >
  PostHog Cloud EU integration for feature flags and experiments in the Agentic
  Cockpit. Use when adding a flag, setting up an A/B experiment between two
  Langflow flow variants, defining a cohort, or recording an event from gateway
  for product analytics.
allowed-tools: Bash(curl:*)
---

# PostHog — flags + experiments

## When to use this skill

- Gating a new pilot flow behind `pilot:<id>` flag.
- A/B testing two flow variants (`variant_id` on the `flows` table maps 1:1 to a PostHog flag variant key).
- Defining cohorts (e.g., `senior-handler-cohort` for HITL routing v1.1).
- Recording `pilot.run.started`, `pilot.run.completed`, `hitl.decision.made` events.

## Flag vs Experiment decision table

| Use case | Use flag | Use experiment |
|---|---|---|
| Gate feature for all users by default | ✓ | |
| A/B test two Langflow flow variants | | ✓ |
| HITL routing cohort (single arm) | ✓ | |
| Measure impact of a UX change | | ✓ |
| Emergency kill-switch / feature rollback | ✓ | |
| Measure claim cycle-time difference | | ✓ |

## NEVER

- **Never use `app.posthog.com`** — use `eu.i.posthog.com` (EU data residency required for AXA).
- **Never use PostHog for trace/latency telemetry** — that belongs in Langfuse.
- **Never evaluate flags without `send_feature_flag_events=True`** on the first call — omitting it breaks experiment funnel analysis.
- **Never use a user UUID as `distinct_id`** — use `chatwoot_conversation_id` so stickiness tracks the conversation, not the operator.
- **Never call `ph.shutdown()` inside a hot code path** — it flushes the queue synchronously and adds hundreds of ms of latency. Call it only at process exit.

## Configuration

```
POSTHOG_HOST=https://eu.i.posthog.com
POSTHOG_API_KEY=phx_*       # personal API key (server, for /decide + management)
POSTHOG_PROJECT_API_KEY=phc_*  # project key (client)
```

**Region: EU.** Never use the default `app.posthog.com` — data residency matters for AXA.

## Server-side flag eval (sticky per conversation)

The gateway evaluates flags with `distinct_id = chatwoot_conversation_id` so the same conversation always gets the same variant for the lifetime of the run.

```python
from posthog import Posthog
ph = Posthog(api_key=POSTHOG_PROJECT_API_KEY, host=POSTHOG_HOST)

variant = ph.get_feature_flag(
    "property-fast-track",
    distinct_id=conversation_id,
    person_properties={"tenant_id": tenant_id, "pilot_id": pilot_id},
    send_feature_flag_events=True,
)
# variant: "control" | "treatment_a" | None
```

Cache the variant on `scenario_runs.runtime_metadata.variant` so reloads of the cockpit return the same answer.

## Experiments

1. Create the **flag** first (multivariate: `control`, `treatment_a`).
2. Create the **experiment** referencing the flag, with primary metric `hitl.decision.approved.rate`.
3. Map variant keys to `flows.variant_id` rows in Supabase.
4. Gateway picks the flow whose `variant_id` matches `ph.get_feature_flag(...)`.

Do **not** rely on PostHog for run telemetry — that goes to Langfuse. PostHog only sees: `pilot.run.started`, `pilot.run.completed`, `hitl.decision.made`, `flag.exposed`. Keep the event surface tiny.

## Cohorts

Cohort definitions live in PostHog UI; `cohorts.predicate` jsonb in Supabase mirrors the predicate for offline replay. Sync via `gateway/scripts/sync_cohorts.py` (one-way, PostHog → Supabase, run nightly).

## Common pitfalls

- `distinct_id` must be **stable across the run lifetime**. Conversation ID is the canonical choice; user IDs change between Chatwoot conversations.
- `send_feature_flag_events=True` is required for experiment analysis — otherwise the exposure isn't recorded.
- The Python SDK sends events asynchronously; call `ph.flush()` before the gateway exits a request handler to guarantee delivery in short-lived contexts.
- Flag changes can take ~30 seconds to propagate. For tests, use `feature_flags=` overrides on the client.

## References

- PostHog Python SDK: https://posthog.com/docs/libraries/python
- Experiments docs: https://posthog.com/docs/experiments
- Flag bootstrap (so the cockpit can load with the right variant on first paint): https://posthog.com/docs/feature-flags/bootstrapping
