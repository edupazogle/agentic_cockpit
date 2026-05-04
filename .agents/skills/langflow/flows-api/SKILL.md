---
name: langflow-flows-api
description: "Run, build, and manage the 5 production Langflow flows in this project. Use when: executing a flow by ID, running flows with tweaks, streaming output, managing sessions for HITL, parsing flow results, or debugging execution errors."
argument-hint: "Describe what you need (e.g., 'run Claims Adjudication flow', 'stream Policy Renewals output', 'run flow with custom system prompt tweak')"
---

# Langflow Flows API — GDAI Agentic Cockpit

## Production Flow IDs

| Flow Name | ID | Purpose |
|-----------|-----|---------|
| Insurance Underwriting | `0f31c33d-63f4-43fe-8c67-64fe869d532b` | Client risk scoring and proposals |
| Insurance Underwriting (Backup) | `9aa6a19a-90d6-45ec-8199-1668ac6dfb6b` | Backup copy |
| Claims Adjudication | `53ed667f-3bae-4572-8097-e4341f6371b7` | Claims automation |
| Policy Renewals | `15751e62-38ff-406d-a90d-9b80ca6ce24b` | Renewal eligibility and pricing |
| Claims Fast Track | `339cf52e-4d25-4e4f-8402-8dcc4c97e439` | Property claims fast-track |

**API key** (persistent, for all `/run/` calls): `sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM`

## Run a Flow

```bash
LF_API_KEY="sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM"
FLOW_ID="0f31c33d-63f4-43fe-8c67-64fe869d532b"  # Insurance Underwriting

curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "Applicant: Maria Lopez, age 42, no prior claims. Assess eligibility.",
    "input_type": "chat",
    "output_type": "chat"
  }' --max-time 180
```

### Parse the response
```python
import json

data = json.loads(response_text)

if 'detail' in data:
    # Error — parse nested message
    detail = data['detail']
    if isinstance(detail, str):
        try: detail = json.loads(detail)
        except: pass
    msg = detail.get('message', detail) if isinstance(detail, dict) else detail
    print(f"ERROR: {msg}")
else:
    # Success — navigate the output tree
    for out in data.get('outputs', []):
        for result in out.get('outputs', []):
            msg = result.get('results', {}).get('message', {})
            if isinstance(msg, dict) and msg.get('text'):
                print(f"[{result.get('component_display_name','?')}]: {msg['text']}")
```

**Output tree**: `data.outputs[N].outputs[M].results.message.text`

## Run with Tweaks (runtime overrides)

Override node values without modifying the saved flow. Use the node **component ID** as the key:

```bash
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "test query",
    "input_type": "chat",
    "output_type": "chat",
    "tweaks": {
      "Agent-3zIL0": {
        "system_prompt": "You are a strict underwriting agent. Decline borderline cases."
      },
      "SQLiteConnectionString-2zQH3": {
        "path": "/home/mr_e/langflow/data/insurance_underwriting.sqlite"
      }
    }
  }' --max-time 180
```

### Known node IDs (shared across all 5 flows)

| Component | Node ID | Tweak fields |
|-----------|---------|-------------|
| Agent | `Agent-3zIL0` | `system_prompt`, `model_name`, `temperature`, `max_tokens` |
| SQL Database | `SQLComponent-hVxlo` | `query` |
| SQLite Connection | `SQLiteConnectionString-2zQH3` | `path` |
| Prompt | `CBLOJ` | `template` |
| Structured Output | `hqhJJ` | `schema_name` |
| Chat Output | `6UtBI` | (read-only) |

## Session Management (multi-turn / HITL)

Use `session_id` to preserve context across multiple calls to the same flow. This is how the gateway implements multi-turn conversations and HITL resume:

```bash
# First turn — creates a session
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "Start underwriting for claim CLM-042",
    "input_type": "chat",
    "output_type": "chat",
    "session_id": "claim-CLM-042"
  }' --max-time 180

# Follow-up turn — resumes same session
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "Operator approved: proceed with fast-track settlement",
    "input_type": "chat",
    "output_type": "chat",
    "session_id": "claim-CLM-042"
  }' --max-time 180
```

**Session ID naming convention in this project**: `{pilot}-{claim_id}` e.g., `property-fast-track-CLM-042`

**⚠️ Langflow 1.8.4 session state**: Session state is stored in the Langflow DB (`langflow.db`). Sessions are per-flow — the same `session_id` used with two different flows does NOT share state.

## Stream Flow Output

```bash
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=true" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input_value": "test", "input_type": "chat", "output_type": "chat"}'
# Returns Server-Sent Events (SSE). Each event is a JSON chunk.
```

## Build and Monitor (step-by-step execution)

The build API executes the flow node-by-node and emits events. Uses Bearer auth, not API key.

```bash
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
FLOW_ID="0f31c33d-63f4-43fe-8c67-64fe869d532b"

# Trigger build
JOB_ID=$(curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/build/$FLOW_ID/flow" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -c "import json,sys; print(json.load(sys.stdin)['job_id'])")

# Poll build events (SSE stream)
curl -s --compressed "http://127.0.0.1:7860/api/v1/build/$JOB_ID/events" \
  -H "Authorization: Bearer $ACCESS"
```

## Run History and Messages

```bash
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

# Get message history for a flow
curl -s --compressed "http://127.0.0.1:7860/api/v1/monitor/messages?flow_id=$FLOW_ID&limit=10" \
  -H "Authorization: Bearer $ACCESS" | python3 -c "
import json, sys
for m in json.load(sys.stdin):
    print(f'[{m[\"sender\"]}] {m[\"text\"][:200]}')"

# Get build history
curl -s --compressed "http://127.0.0.1:7860/api/v1/monitor/builds?flow_id=$FLOW_ID&limit=5" \
  -H "Authorization: Bearer $ACCESS"
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"requires a valid API key"` | Bearer token used on `/run/` | Use `x-api-key` header |
| `"API key expired"` / `400 API_KEY_INVALID` | `GOOGLE_API_KEY` in Langflow global vars expired | Delete + recreate the variable (see runtime skill) |
| `"No permission to run this flow"` | API key belongs to a different user | Only run flows owned by the `langflow` user; starter-project flows require their owner's key |
| `[Errno 5] Input/output error` | Langflow stdout points to a closed terminal | Restart Langflow with `nohup ... > langflow.log 2>&1` |
| Flow times out (120s+) | LLM taking too long or credential invalid | Check credential first; increase `--max-time` |
| Empty `outputs` array | Flow built but produced no output component | Check `Chat Output` node is connected and not disabled |
| Garbled/binary response | Missing gzip decompression | Always use `--compressed` with curl |

## Webhook Trigger

For flows that have a **Webhook** input node:

```bash
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/webhook/$FLOW_ID" \
  -H "Content-Type: application/json" \
  -d '{"input_value": "payload from external system"}'
```

---

## Building Flows From Scratch via API

**Verified working pattern** — tested in Langflow 1.8.4. When creating new flows programmatically, these rules are required or the flow saves but fails to run with `KeyError: 'data'`.

### Critical rule: edges must include `data` with parsed handle dicts

The Langflow graph builder (`lfx/graph/graph/base.py` line ~511) reads:
```python
source_id = edge["data"]["sourceHandle"]["id"]
target_id = edge["data"]["targetHandle"]["id"]
```
Without `edge["data"]`, every new flow fails at runtime with `"Error while creating graph from payload: 'data'"`.

### Full edge builder

```python
Q = "\u0153"  # U+0153 œ — Langflow's quote char in handle strings

def make_src_handle_obj(node_id, data_type, name, output_types):
    return {"dataType": data_type, "id": node_id, "name": name, "output_types": output_types}

def make_tgt_handle_obj(node_id, field_name, input_types, field_type):
    return {"fieldName": field_name, "id": node_id, "inputTypes": input_types, "type": field_type}

def encode_handle(handle_dict):
    """Encode handle dict → œ-quoted JSON string for top-level sourceHandle/targetHandle."""
    def encode_val(v):
        if isinstance(v, list):
            return "[" + ",".join(Q+x+Q for x in v) + "]"
        return Q + v + Q
    parts = [Q+k+Q+":"+encode_val(v) for k, v in handle_dict.items()]
    return "{" + ",".join(parts) + "}"

def make_edge(src_id, tgt_id, src_handle_obj, tgt_handle_obj):
    sh_str = encode_handle(src_handle_obj)
    th_str = encode_handle(tgt_handle_obj)
    return {
        "source": src_id,
        "target": tgt_id,
        "sourceHandle": sh_str,       # œ-quoted string (React Flow display)
        "targetHandle": th_str,       # œ-quoted string
        "id": f"reactflow__edge-{src_id}{sh_str}-{tgt_id}{th_str}",
        "data": {
            "sourceHandle": src_handle_obj,   # REQUIRED: parsed dict
            "targetHandle": tgt_handle_obj,   # REQUIRED: parsed dict
        },
        "selected": False,
        "animated": False,
        "className": "",
    }
```

### Full node builder

Copy ALL keys from `/api/v1/all` — not just a subset. Missing keys causes `'data'` error on execution:

```python
import copy

NODE_KEYS = [
    "template", "outputs", "base_classes", "description", "display_name",
    "documentation", "icon", "minimized", "custom_fields", "output_types",
    "pinned", "conditional_paths", "frozen", "field_order", "beta",
    "legacy", "edited", "metadata", "tool_mode",
]

def make_node(comp_name, node_id, position, comp_lookup):
    """comp_lookup = {name: val for cat, comps in all_comps.items() for name, val in comps.items()}"""
    comp = comp_lookup[comp_name]
    inner = {k: copy.deepcopy(comp[k]) for k in NODE_KEYS if k in comp}
    inner["lf_version"] = "1.8.4"
    return {
        "id": node_id,
        "type": "genericNode",
        "position": position,
        "selected": False,
        "data": {"id": node_id, "type": comp_name.replace(" ", ""), "node": inner, "showNode": True}
    }
```

**Safer alternative**: copy a node from an existing working flow (`copy.deepcopy`) and assign a new `id` + `data.id`. This guarantees the node structure matches what Langflow expects.

### Handle types for common components

| Component | Output name | `dataType` | `output_types` | Input field | `inputTypes` | `type` |
|-----------|-------------|-----------|----------------|-------------|-------------|--------|
| `Prompt` (not PromptTemplate) | `prompt` | `Prompt` | `["Message"]` | — | — | — |
| `Agent` | `response` | `Agent` | `["Message"]` | `input_value` | `["Message"]` | `str` |
| `Agent` | — | — | — | `system_prompt` | `["Message"]` | `str` |
| `Agent` | — | — | — | `tools` | `["Tool"]` | `other` |
| `ChatInput` | `message` | `ChatInput` | `["Message"]` | — | — | — |
| `ChatOutput` | — | — | — | `input_value` | `["Data","DataFrame","Message"]` | `other` |
| `StructuredOutput` | `structured_output` | `StructuredOutput` | `["Data"]` | `input_value` | `["Message"]` | `str` |

**Note**: Use `"Prompt"` (not `"Prompt Template"`) for flows that match the existing production topology. "Prompt Template" has `name: None` and its dynamic `{variable}` fields don't get created via API.

### Complete 3-node example (Prompt → Agent → ChatOutput)

```python
import json, uuid, requests, copy

BASE = "http://127.0.0.1:7860"
Q = "\u0153"

ACCESS = requests.get(f"{BASE}/api/v1/auto_login").json()["access_token"]
auth = {"Authorization": f"Bearer {ACCESS}"}

# Get known-good node structures from existing working flow
src = requests.get(f"{BASE}/api/v1/flows/0f31c33d-63f4-43fe-8c67-64fe869d532b", headers=auth).json()
nodes_by_type = {n['data']['type']: n for n in src['data']['nodes']}

pr_id = f"Prompt-{uuid.uuid4().hex[:5]}"
ag_id = f"Agent-{uuid.uuid4().hex[:5]}"
co_id = f"ChatOutput-{uuid.uuid4().hex[:5]}"

def copy_node(type_name, new_id, position):
    n = copy.deepcopy(nodes_by_type[type_name])
    n['id'] = new_id; n['data']['id'] = new_id; n['position'] = position
    return n

pr_node = copy_node("Prompt", pr_id, {"x": 200, "y": 50})
pr_node['data']['node']['template']['template']['value'] = "Your system prompt here"
ag_node = copy_node("Agent", ag_id, {"x": 650, "y": 300})
ag_node['data']['node']['template']['tools']['value'] = []  # no tools
co_node = copy_node("ChatOutput", co_id, {"x": 1100, "y": 300})

edges = [
    make_edge(pr_id, ag_id,
              make_src_handle_obj(pr_id, "Prompt", "prompt", ["Message"]),
              make_tgt_handle_obj(ag_id, "system_prompt", ["Message"], "str")),
    make_edge(ag_id, co_id,
              make_src_handle_obj(ag_id, "Agent", "response", ["Message"]),
              make_tgt_handle_obj(co_id, "input_value", ["Data","DataFrame","Message"], "other")),
]

payload = {
    "name": "My New Flow",
    "description": "...",
    "data": {"nodes": [pr_node, ag_node, co_node], "edges": edges,
             "viewport": {"x": 0, "y": 0, "zoom": 1}},
    "is_component": False
}
resp = requests.post(f"{BASE}/api/v1/flows/",
                     headers={**auth, "Content-Type": "application/json"}, json=payload)
new_id = resp.json()["id"]
```
