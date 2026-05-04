---
name: chatwoot
description: >
  HITL (human-in-the-loop) integration with Chatwoot 4.x for the GDAI Agentic Cockpit.
  Use when the gateway needs to pause a Langflow run for operator approval, post a
  handover packet, receive operator decisions via webhook, or query conversation
  history. This skill covers the AXA-specific conventions; the upstream Chatwoot
  API docs cover everything else.
allowed-tools: Bash(curl:*), Bash(jq:*)
---

# Chatwoot — HITL handover

## When to use this skill

- Pausing a Langflow flow at a decision gate (`reserve_gate`, `payment_gate`, `escalation_gate`).
- Resuming a Langflow session from an operator decision.
- Reading Chatwoot conversation context for an audit-log entry.
- Wiring a new HITL gate type.

## Gate type decision table

| Gate | Trigger condition | Decision options | Operator SLA |
|---|---|---|---|
| `reserve_gate` | Reserve estimate exceeds €X or model confidence < threshold | `approve` / `edit_amount` / `reject` | 4 h |
| `payment_gate` | Payment authorization required before disbursement | `approve` / `reject` | 1 h |
| `escalation_gate` | Claim severity is HIGH or CRITICAL (auto-escalated) | `approve` / `escalate_to_manager` | 30 min |

Set `sla_deadline` in the custom attributes to the UTC ISO-8601 timestamp of the deadline. The cockpit UI renders it as a countdown badge.

## Key endpoints

Base: `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}`. Auth: `api_access_token: ${CHATWOOT_API_TOKEN}` header.

| Verb | Path | Purpose |
|---|---|---|
| POST | `/conversations` | Create a conversation for a HITL item |
| POST | `/conversations/:id/messages` | Send the **handover packet** as a private note |
| PATCH | `/conversations/:id/custom_attributes` | Set `claim_id`, `langfuse_trace_id`, `decision_options`, `sla_deadline` |
| POST | `/conversations/:id/labels` | Tag with `pilot:property-fast-track`, `priority:escalated` |
| GET | `/conversations/:id` | Read state for audit |

## The handover packet

A private note (`message_type=2`, `private=true`) with **markdown** body:

```
### Decision required — ${pilot_id}

- **Run:** ${run_id} (Langfuse: [trace](${langfuse_url}/trace/${trace_id}))
- **Step:** ${step_key}
- **Reserve proposed:** €${reserve_eur}
- **Confidence:** ${confidence}
- **Policy refs:** ${policy_refs.join(", ")}

**Options:**
1. ✅ Approve as-is
2. ✏️ Edit reserve and approve
3. ❌ Reject (provide reason)
4. ⤴️ Escalate to senior

SLA deadline: ${sla_deadline} (${minutes_left} min remaining)
```

Plus custom attributes (set in the same conversation):

```json
{
  "claim_id": "CLM-...",
  "run_id": "<uuid>",
  "langfuse_trace_id": "<id>",
  "pilot_id": "property-fast-track",
  "decision_options": ["approve","edit","reject","escalate"],
  "sla_deadline": "2026-05-04T10:30:00Z"
}
```

## Operator → gateway webhook

Chatwoot posts to `POST ${GATEWAY_URL}/webhooks/chatwoot` on every conversation event. Gateway:

1. Validates `X-Chatwoot-Signature` HMAC against `CHATWOOT_HMAC_SECRET` (raw body).
2. Filters for `event=message_created`, `private=true`, `message_type=outgoing`, content matching `^/decision (approve|edit|reject|escalate)(\s+.*)?$`.
3. Resolves `conversation_id → run_id` via `hitl_items` table.
4. Updates `hitl_items.state` and `audit_log`.
5. Calls Langflow `/api/v1/run/${flow_id}/resume?session_id=${session_id}` with the decision payload.

## Common pitfalls

- **`private=true` is mandatory** for handover packets — otherwise the customer sees the agent's reasoning.
- Chatwoot resets custom attributes only when explicitly patched. Always send the full attribute set, not partial.
- HMAC is over the **raw request body**, not parsed JSON. Buffer the body in middleware.
- The `created_at` timestamp on the webhook is in seconds, not ms — multiply by 1000 before `new Date()`.

## Bootstrap (one-time, per-tenant)

1. Create a custom-attributes definition: `claim_id`, `run_id`, `langfuse_trace_id`, `pilot_id`, `decision_options`, `sla_deadline`.
2. Create labels: `pilot:property-fast-track`, `pilot:motor-fleet`, `priority:escalated`, `state:hitl-pending`.
3. Create the operator team and assign the bootstrap operator to it.
4. Generate API token for the gateway → put in Railway env as `CHATWOOT_API_TOKEN`.

## References

- Chatwoot API: https://www.chatwoot.com/developers/api/
- HMAC validation: see `gateway/src/gateway/routes/webhooks_chatwoot.py`.
- Existing Chatwoot deploy: `~/chatwoot/docker-compose.yml` (account ID `2`).
