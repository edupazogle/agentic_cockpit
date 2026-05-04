---
name: langflow-hitl-resume
description: "Implement and operate Human-in-the-Loop (HITL) pause/resume in Langflow flows for the GDAI Agentic Cockpit. Use when: a flow needs to pause for operator approval, the gateway needs to resume a paused flow, implementing decision gates, or integrating Langflow with the Chatwoot handover queue."
argument-hint: "Describe the HITL scenario (e.g., 'pause the underwriting flow and wait for operator decision', 'resume flow after operator approved claim')"
---

# Langflow HITL / WaitForResume — GDAI Agentic Cockpit

## Architecture Overview

Langflow 1.8.4 does **not** have native durable WaitForResume (checkpointed suspend/resume). The cockpit implements HITL durability through the gateway + `hitl_items` Postgres table:

```
Flow reaches decision gate
        │
        ▼
  [Custom Component: HitlGate]
  Calls gateway HITL pause endpoint
        │
        ▼
  Gateway writes hitl_items row (status=pending)
  Gateway posts Chatwoot handover packet
        │
        ▼
  Flow RETURNS current result (does not block)
  Session state preserved via session_id in Langflow memory
        │
        ▼
  Operator acts in Chatwoot
  Chatwoot webhook → gateway → /internal/hitl/resume
        │
        ▼
  Gateway calls flow again with session_id + operator decision
  Flow continues from where it left off (context in memory)
```

**Key constraint**: Langflow 1.8.4 does not truly suspend mid-flow. HITL is implemented via **two separate flow runs** with the same `session_id`. The first run produces a decision request. The second run, with the operator's response injected as `input_value`, continues the conversation.

## HITL Flow Design Pattern

### Pattern 1: Structured JSON Response (Recommended)

Design the flow to return a structured JSON that signals HITL is needed:

```json
{
  "status": "awaiting_approval",
  "decision_type": "underwriting_approval",
  "claim_id": "CLM-042",
  "summary": "High-risk applicant. Premium: $2,400/yr. Recommend: manual review.",
  "options": ["approve", "decline", "escalate"],
  "context": { "risk_score": 87, "prior_claims": 2 }
}
```

The gateway detects `status: "awaiting_approval"` in the flow output and triggers the HITL pause.

### Pattern 2: Keyword Detection

The flow's Agent outputs a message containing a sentinel phrase:
```
HITL_REQUIRED: Claim CLM-042 requires manual approval. Risk score: 87/100.
Decision options: [approve, decline, escalate]
```

The gateway detects `HITL_REQUIRED:` and parses the decision context.

## Gateway Integration Points

### Gateway receives initial flow result
```python
# In gateway/routers/runs.py (pseudo-code)
result = await langflow_client.run_flow(
    flow_id=FLOW_IDS["property-fast-track"],
    input_value=user_message,
    session_id=f"property-fast-track-{claim_id}",
)

output_text = extract_output_text(result)

if "awaiting_approval" in output_text or is_hitl_response(result):
    # Parse the structured response
    hitl_data = parse_hitl_response(output_text)
    
    # Write to hitl_items table
    await db.execute("""
        INSERT INTO hitl_items (
            id, tenant_id, run_id, claim_id, langflow_session_id,
            decision_type, options, summary, status, sla_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW() + INTERVAL '4 hours')
    """, hitl_id, "gdai-default", run_id, claim_id, 
        f"property-fast-track-{claim_id}",
        hitl_data["decision_type"], hitl_data["options"],
        hitl_data["summary"])
    
    # Post Chatwoot handover packet (see chatwoot skill)
    await post_chatwoot_handover(claim_id, hitl_data, langfuse_trace_id)
    
    # Update run status
    await run_store.set_waiting(run_id)
```

### Gateway resumes flow after operator decision
```python
# In gateway/routers/internal.py — called by Chatwoot webhook
async def resume_hitl(hitl_id: str, operator_decision: str, operator_id: str):
    # Get the hitl_items row
    hitl = await db.fetchrow("SELECT * FROM hitl_items WHERE id=$1", hitl_id)
    
    # Resume the Langflow session with the operator's decision
    result = await langflow_client.run_flow(
        flow_id=FLOW_IDS[hitl["pilot_id"]],
        input_value=f"Operator decision: {operator_decision}",  # injected as next message
        session_id=hitl["langflow_session_id"],  # SAME session_id = continues memory
    )
    
    # Update hitl_items
    await db.execute("""
        UPDATE hitl_items 
        SET status='resolved', decision=$1, resolved_by=$2, resolved_at=NOW()
        WHERE id=$3
    """, operator_decision, operator_id, hitl_id)
    
    # Update scenario run
    await run_store.set_running(hitl["run_id"])
    
    return result
```

## Database Schema (`hitl_items`)

```sql
-- Applied in migration 0007 or later
CREATE TABLE IF NOT EXISTS hitl_items (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           text NOT NULL REFERENCES tenants(id),
    run_id              uuid NOT NULL REFERENCES scenario_runs(id),
    claim_id            text,
    langflow_session_id text NOT NULL,       -- used to resume the flow
    decision_type       text NOT NULL,       -- e.g., 'underwriting_approval'
    summary             text,               -- shown to operator
    options             jsonb,              -- e.g., ["approve","decline","escalate"]
    context             jsonb,              -- risk scores, policy data etc.
    status              text NOT NULL DEFAULT 'pending',  -- pending|resolved|expired
    sla_deadline        timestamptz,
    decision            text,               -- operator's chosen option
    resolved_by         text,               -- operator user ID
    resolved_at         timestamptz,
    langfuse_trace_id   text,
    created_at          timestamptz NOT NULL DEFAULT now()
);
```

## Langflow Session State Behaviour

- Langflow stores message history per `(flow_id, session_id)` pair in the Langflow SQLite DB.
- Each new run with the same `session_id` appends to the same conversation thread.
- The Agent sees full prior message history as context.
- **There is no explicit "resume" API** — injecting the operator decision as a new `input_value` message with the same `session_id` is the resume mechanism.

### Session ID convention
```
{pilot_slug}-{claim_id}
```
Examples:
- `property-fast-track-CLM-042`
- `motor-fleet-CLM-099`

### Check existing session messages
```bash
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
FLOW_ID="339cf52e-4d25-4e4f-8402-8dcc4c97e439"  # Claims Fast Track

curl -s --compressed "http://127.0.0.1:7860/api/v1/monitor/messages?flow_id=$FLOW_ID&session_id=property-fast-track-CLM-042" \
  -H "Authorization: Bearer $ACCESS" | python3 -c "
import json,sys
for m in json.load(sys.stdin):
    print(f'[{m[\"sender\"]}] {m[\"text\"][:150]}')"
```

## HitlGate Custom Component (stub)

For flows that need a more explicit pause signal, use a custom component in `langflow/components/hitl/hitl_gate.py`:

```python
from langflow.custom import Component
from langflow.inputs import MessageTextInput, BoolInput
from langflow.outputs import MessageOutput
from langflow.schema import Message


class HitlGate(Component):
    """
    Intercepts flow execution at a decision gate and returns a structured
    HITL payload for the gateway to detect and pause on.
    """
    display_name = "HITL Gate"
    description = "Pause flow for human-in-the-loop operator decision"
    icon = "shield-question"

    inputs = [
        MessageTextInput(
            name="summary",
            display_name="Decision Summary",
            info="Human-readable summary of what the operator needs to decide",
        ),
        MessageTextInput(
            name="options",
            display_name="Decision Options (JSON array)",
            value='["approve", "decline", "escalate"]',
        ),
        MessageTextInput(
            name="decision_type",
            display_name="Decision Type",
            value="underwriting_approval",
        ),
    ]

    outputs = [MessageOutput(name="hitl_payload", display_name="HITL Payload")]

    def build_message(self) -> Message:
        import json
        payload = {
            "status": "awaiting_approval",
            "decision_type": self.decision_type,
            "summary": self.summary,
            "options": json.loads(self.options),
        }
        return Message(text=json.dumps(payload), sender="AI", sender_name="HitlGate")
```

Save to `/home/mr_e/langflow/components/hitl/hitl_gate.py` and add `__init__.py` in that folder. Langflow auto-loads from `LANGFLOW_COMPONENTS_PATH`.

## Chatwoot Handover Packet

When a HITL gate triggers, the gateway posts to Chatwoot with these custom attributes:

```json
{
  "claim_id": "CLM-042",
  "langfuse_trace_id": "trace-abc123",
  "decision_options": ["approve", "decline", "escalate"],
  "risk_score": 87,
  "sla_deadline": "2026-05-03T17:00:00Z",
  "hitl_item_id": "uuid-of-hitl_items-row"
}
```

The operator resolves by clicking an option in Chatwoot → webhook fires → gateway resumes flow.

See `chatwoot/SKILL.md` for exact handover packet structure and webhook signature verification.

## Audit Trail

Every HITL state transition must write to `audit_log`:

```sql
INSERT INTO audit_log (tenant_id, entity_type, entity_id, action, actor, payload)
VALUES (
  'gdai-default',
  'hitl_items',
  $hitl_item_id,
  'hitl_resolved',
  $operator_user_id,
  '{"decision": "approve", "channel": "chatwoot"}'::jsonb
);
```

The hash-chain trigger on `audit_log` handles integrity automatically.

## Testing HITL End-to-End

```bash
LF_API_KEY="sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM"
FLOW_ID="339cf52e-4d25-4e4f-8402-8dcc4c97e439"  # Claims Fast Track
SESSION="property-fast-track-CLM-042"

# Step 1: Initial run — should return awaiting_approval
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"input_value\": \"Process high-risk claim CLM-042, sum insured £150,000\", \"input_type\": \"chat\", \"output_type\": \"chat\", \"session_id\": \"$SESSION\"}" \
  --max-time 180

# Step 2: Resume with operator decision (same session_id)
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"input_value\": \"Operator decision: approve. Proceed with settlement.\", \"input_type\": \"chat\", \"output_type\": \"chat\", \"session_id\": \"$SESSION\"}" \
  --max-time 180
```
