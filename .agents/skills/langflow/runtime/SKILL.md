---
name: langflow-runtime
description: "Manage and operate the Langflow server in this project. Use when: starting/stopping Langflow, authenticating, listing flows, running flows via API, managing credentials, uploading flow JSON, using the MCP endpoint, running evals, or diagnosing runtime errors."
argument-hint: "Describe what you need (e.g., 'run the Insurance Underwriting flow', 'update the GOOGLE_API_KEY', 'list all flows with IDs')"
---

# Langflow Runtime — GDAI Agentic Cockpit

## Key Facts

| Item | Value |
|------|-------|
| **Version** | 1.8.4 |
| **Server URL** | `http://127.0.0.1:7860` (local) |
| **Python venv** | `/home/mr_e/langflow/.venv/` |
| **Project dir** | `/home/mr_e/langflow/` |
| **LLM provider** | Google Generative AI (Gemini 2.5 Flash) |
| **Credential name** | `GOOGLE_API_KEY` (Langflow global variables) |
| **API key (run)** | `sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM` (name: `flow-test`) |
| **MCP project ID** | `79e4675d-51db-45a0-b9af-50daa2b76481` (Starter Project) |
| **SQLite DB** | `/home/mr_e/langflow/data/insurance_underwriting.sqlite` |
| **Braintrust key** | In `/home/mr_e/langflow/.env` (`BRAINTRUST_API_KEY`) |
| **Log file** | `/home/mr_e/langflow/langflow.log` |

## Active Flows

| Flow Name | Flow ID | Purpose |
|-----------|---------|---------|
| Insurance Underwriting | `0f31c33d-63f4-43fe-8c67-64fe869d532b` | Client risk scoring and underwriting decisions |
| Insurance Underwriting (Backup) | `9aa6a19a-90d6-45ec-8199-1668ac6dfb6b` | Backup copy of underwriting flow |
| Claims Adjudication | `53ed667f-3bae-4572-8097-e4341f6371b7` | Claims decision automation |
| Policy Renewals | `15751e62-38ff-406d-a90d-9b80ca6ce24b` | Renewal eligibility and pricing |
| Claims Fast Track | `339cf52e-4d25-4e4f-8402-8dcc4c97e439` | Fast-track property claims processing |

All 5 production flows share the same node pattern:
- **Agent** (`Agent-3zIL0`) — Google Gemini agent with tools
- **SQL Database** (`SQLComponent-hVxlo`) — executes SQL against the claims DB
- **SQLite String** (`SQLiteConnectionString-2zQH3`) — connection to `/home/mr_e/langflow/data/insurance_underwriting.sqlite`
- **Prompt** (`CBLOJ`), **Structured Output** (`hqhJJ`), **Parser** (`np6fo`), **Calculator** (`dgkgF`), **Chat Output** (`6UtBI`)

## Starting Langflow

**Always start with stdout redirected to a log file** — if started with `2>&1 &` in a terminal that later closes, the process gets `[Errno 5] Input/output error` (EIO) when running flows. This is the #1 failure mode.

```bash
# Correct start command (always use nohup + log file)
LANGFLOW_DATABASE_URL="sqlite:////home/mr_e/langflow/.venv/lib/python3.12/site-packages/langflow/langflow.db" \
LANGFLOW_COMPONENTS_PATH="/home/mr_e/langflow/components" \
nohup /home/mr_e/langflow/.venv/bin/langflow run \
  --host 127.0.0.1 --port 7860 --no-open-browser \
  > /home/mr_e/langflow/langflow.log 2>&1 &
echo "PID: $!"

# Wait for startup (8-10 seconds)
sleep 10
curl -s http://127.0.0.1:7860/health && echo " — Langflow healthy"
```

**Check if running:**
```bash
ps aux | grep langflow | grep -v grep | head -5
curl -s http://127.0.0.1:7860/health
```

**Stop all instances:**
```bash
pkill -f "langflow run"
```

**CRITICAL**: If you see multiple Langflow processes, check their stdout:
```bash
ls -la /proc/<PID>/fd/1  # Should NOT show "(deleted)"
```
If it shows `(deleted)`, kill those processes and restart with `nohup`. The EIO error will persist until you do.

## Authentication

### Method 1: Auto-login Bearer Token (session)
Works on most endpoints. Do NOT use for `/api/v1/run/` endpoints.

```bash
# Get token (auto_login works when LANGFLOW_AUTO_LOGIN=true, which is the default)
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

# Use as header
curl -s --compressed "http://127.0.0.1:7860/api/v1/flows/" \
  -H "Authorization: Bearer $ACCESS"
```

### Method 2: Login with credentials
```bash
ACCESS=$(curl -s --compressed -X POST http://127.0.0.1:7860/api/v1/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=langflow&password=langflow" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
```

### Method 3: API Key (required for `/api/v1/run/` endpoints)
```bash
# The persistent API key — use this for flow execution
LF_API_KEY="sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM"

# Run a flow
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input_value": "...", "input_type": "chat", "output_type": "chat"}'
```

**IMPORTANT**: Always use `--compressed` with curl — all Langflow API responses are gzip-encoded.

### Create a new API key
```bash
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/api_key/" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"name":"my-key"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['api_key'])"
```

## Running Flows

### Basic run
```bash
LF_API_KEY="sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM"
FLOW_ID="0f31c33d-63f4-43fe-8c67-64fe869d532b"  # Insurance Underwriting

curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "Applicant: John Smith, age 35, no prior claims. Eligible?",
    "input_type": "chat",
    "output_type": "chat"
  }' --max-time 180 | python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'detail' in d:
    print('ERROR:', d['detail'])
elif 'outputs' in d:
    for out in d['outputs']:
        for result in out.get('outputs', []):
            msg = result.get('results', {}).get('message', {})
            if isinstance(msg, dict):
                print('OUTPUT:', msg.get('text', '')[:1000])
"
```

### Run with tweaks (override node values at runtime)
```bash
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/run/$FLOW_ID?stream=false" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_value": "query here",
    "input_type": "chat",
    "output_type": "chat",
    "tweaks": {
      "SQLiteConnectionString-2zQH3": {
        "path": "/home/mr_e/langflow/data/insurance_underwriting.sqlite"
      },
      "Agent-3zIL0": {
        "system_prompt": "Custom system prompt override"
      }
    }
  }' --max-time 180
```

### Parse output
```python
import json

with open('/tmp/flow_result.json') as f:
    data = json.load(f)

# Output structure: data.outputs[].outputs[].results.message.text
if 'outputs' in data:
    for out in data['outputs']:
        for result in out.get('outputs', []):
            msg = result.get('results', {}).get('message', {})
            if isinstance(msg, dict):
                text = msg.get('text', '')
                comp = result.get('component_display_name', '')
                print(f'[{comp}]: {text[:500]}')
```

### Run with session (multi-turn conversation)
```json
{
  "input_value": "follow-up question",
  "input_type": "chat",
  "output_type": "chat",
  "session_id": "claim-CLM-001-session"
}
```

### Run a specific named flow (by name instead of ID)
The `/api/v1/run/` endpoint accepts flow name as well as ID.
Flow names with spaces must be URL-encoded: `Insurance%20Underwriting`.

## Flow Management

### List all flows
```bash
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

curl -s --compressed "http://127.0.0.1:7860/api/v1/flows/" \
  -H "Authorization: Bearer $ACCESS" | python3 -c "
import json, sys
for f in json.load(sys.stdin):
    print(f'{f[\"id\"]}  {f[\"name\"]}')"
```

### Get a specific flow
```bash
curl -s --compressed "http://127.0.0.1:7860/api/v1/flows/$FLOW_ID" \
  -H "Authorization: Bearer $ACCESS" > /tmp/flow.json
```

### Upload a flow JSON file
```bash
# Option 1: Create via POST with data body
python3 -c "
import json
with open('imports/claims-flow.json') as f:
    raw = json.load(f)
flow = {'name': 'Claims Fast Track', 'description': '...', 'data': raw, 'is_component': False}
print(json.dumps(flow))
" > /tmp/flow_upload.json

curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/flows/" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d @/tmp/flow_upload.json

# Option 2: Multipart upload
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/flows/upload/" \
  -H "Authorization: Bearer $ACCESS" \
  -F "file=@imports/my-flow.json"
```

### Update flow fields (patch)
```python
import json, requests

# 1. Get the flow
resp = requests.get(
    f"http://127.0.0.1:7860/api/v1/flows/{FLOW_ID}",
    headers={"Authorization": f"Bearer {ACCESS}"},
)
resp.raw.decode_content = True
flow = resp.json()

# 2. Modify a node value
for node in flow['data']['nodes']:
    template = node['data']['node'].get('template', {})
    if 'path' in template:
        template['path']['value'] = '/new/path/to/db.sqlite'

# 3. PATCH back
requests.patch(
    f"http://127.0.0.1:7860/api/v1/flows/{FLOW_ID}",
    headers={"Authorization": f"Bearer {ACCESS}"},
    json={"data": flow["data"]},
)
```

### Delete a flow
```bash
curl -s --compressed -X DELETE "http://127.0.0.1:7860/api/v1/flows/$FLOW_ID" \
  -H "Authorization: Bearer $ACCESS"
```

## Credential Management

Credentials are stored in Langflow's global variable store. Nodes reference them via `load_from_db: true`.

### List all credentials
```bash
curl -s --compressed "http://127.0.0.1:7860/api/v1/variables/" \
  -H "Authorization: Bearer $ACCESS" | python3 -c "
import json, sys
for v in json.load(sys.stdin):
    print(f'{v[\"id\"]}  {v[\"name\"]}  ({v[\"type\"]})  valid={v[\"is_valid\"]}')"
```

### Update the GOOGLE_API_KEY
**⚠️ PATCH does NOT work in Langflow 1.8.4** — the value is silently ignored. Must delete + recreate:

```bash
VAR_ID="43614969-0afd-437e-b496-ff55ef71ec83"  # Current GOOGLE_API_KEY variable ID
NEW_KEY="AIza..."  # your fresh Google API key

# Delete old, then create fresh
curl -s --compressed -X DELETE "http://127.0.0.1:7860/api/v1/variables/$VAR_ID" \
  -H "Authorization: Bearer $ACCESS"

curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/variables/" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"GOOGLE_API_KEY\",\"type\":\"Credential\",\"value\":\"$NEW_KEY\",\"default_fields\":[]}" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Created: {d[\"id\"]} valid={d[\"is_valid\"]}')"
```

**Note**: Credential values are masked (`null`) in GET responses. Check `is_valid: true` to confirm a value is stored.

### Current credentials
| Name | ID | Status |
|------|----|--------|
| `GOOGLE_API_KEY` | `43614969-0afd-437e-b496-ff55ef71ec83` | `is_valid: true` (verified 2026-05-03) |

Key value: `AIzaSyAEOVJQSqa7v-PgY1ApFN8onxHTeIokMeg` (also stored as `GOOGLE_GEMINI_API_KEY` in `/home/mr_e/agentic/.env.local`)

**⚠️ If flows fail with "API Key not found" or "API key expired"**:
The GOOGLE_API_KEY in Langflow global vars has expired. Delete and recreate it:
```bash
ACCESS=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
NEW_KEY="AIza..."  # your fresh key

# Delete old
curl -s --compressed -X DELETE "http://127.0.0.1:7860/api/v1/variables/43614969-0afd-437e-b496-ff55ef71ec83" \
  -H "Authorization: Bearer $ACCESS"

# Recreate (PATCH does not work in 1.8.4 — must delete+create)
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/variables/" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"GOOGLE_API_KEY\",\"type\":\"Credential\",\"value\":\"$NEW_KEY\",\"default_fields\":[]}"
```
**⚠️ PATCH `/api/v1/variables/{id}` does NOT actually update the stored value in v1.8.4** — always delete + recreate.

## MCP Integration

Langflow exposes flows as MCP tools. The VS Code MCP server is configured in `.vscode/mcp.json`:

```
URL: http://127.0.0.1:7860/api/v1/mcp/project/79e4675d-51db-45a0-b9af-50daa2b76481/streamable
Header: x-api-key: gAAAAABpzikVV7x9f4yX1uqgfxilsHrJHPgRpNSeNe8_...
```

### Discover MCP tools
```bash
curl -s --compressed "http://127.0.0.1:7860/api/v1/mcp/project/$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS"
# Returns list of flows with mcp_enabled=true
```

### Test MCP tool invocation (streamable HTTP)
```bash
PROJECT_ID="79e4675d-51db-45a0-b9af-50daa2b76481"
LF_MCP_KEY="gAAAAABpzikVV7x9f4yX1uqgfxilsHrJHPgRpNSeNe8_OvZMEiPR3WiTww-3KhHtAcdXPxpW5s3g5niLAqn4mNRatqK6tPdtZC19j4qblJLLDXdNTjvaDMEhc0hivqYBYlkrCveH5mo6"

# List tools
curl -s --compressed \
  "http://127.0.0.1:7860/api/v1/mcp/project/$PROJECT_ID/streamable/" \
  -H "x-api-key: $LF_MCP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Call a tool (invoke a flow by its action_name)
curl -s --compressed \
  "http://127.0.0.1:7860/api/v1/mcp/project/$PROJECT_ID/streamable/" \
  -H "x-api-key: $LF_MCP_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"insurance_underwriting","arguments":{"input_value":"test query"}}}'
```

### Enable a flow as an MCP tool
```bash
# PATCH the flow with mcp_enabled=true
curl -s --compressed -X PATCH "http://127.0.0.1:7860/api/v1/flows/$FLOW_ID" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"endpoint_name": "my_tool_name"}'
```

**Currently enabled MCP tools:**
| Action Name | Flow | ID |
|-------------|------|----|
| `insurance_underwriting` | Insurance Underwriting | `0f31c33d...` |
| `insurance_underwriting_backup` | Insurance Underwriting (Backup) | `9aa6a19a...` |

## Custom Components

Custom components live in `/home/mr_e/langflow/components/`:
```
components/
├── scorers/
│   ├── __init__.py
│   └── braintrust_scorer.py   # Braintrust scoring component
└── testing/
    ├── __init__.py
    └── hello_world.py         # Test/example component
```

Components are loaded automatically when Langflow starts with:
```bash
LANGFLOW_COMPONENTS_PATH="/home/mr_e/langflow/components"
```

See the `langflow-components` skill in this directory for how to create new components.

## Evals (Braintrust)

Eval scripts live in `/home/mr_e/langflow/evals/`:

```bash
cd /home/mr_e/langflow
source .venv/bin/activate

# Run full eval against live flow
BRAINTRUST_API_KEY=$(grep BRAINTRUST_API_KEY .env | cut -d= -f2-) \
python evals/run_eval.py

# Run cached (no live LLM calls — uses cached flow output)
python evals/run_eval.py --cached /tmp/flow_run.json

# Upload golden dataset only
python evals/run_eval.py --upload-dataset

# Run against a different flow
python evals/run_eval.py --flow-id 9aa6a19a-90d6-45ec-8199-1668ac6dfb6b

# Include LLM-as-judge scorers
python evals/run_eval.py --llm-scorers

# Run multi-trial (3 repetitions for variance)
python evals/run_eval.py --trial-count 3
```

**Eval env vars:**
```bash
LANGFLOW_URL="http://localhost:7860"
LANGFLOW_API_KEY="sk-LNt9mg9gmHZpHfCgcAGUKWwbujPStrEEiZrd17jjNSM"
LANGFLOW_FLOW_ID="0f31c33d-63f4-43fe-8c67-64fe869d532b"
BRAINTRUST_API_KEY="sk-vpRODpuelEVqLqhxaxX0qjPhf1ukqwGZy6OkGrQt0Ud4P6wO"
```

## SQLite Database

The insurance flows use a SQLite database with 3 tables:

```
/home/mr_e/langflow/data/insurance_underwriting.sqlite
├── potential_clients   (20 rows) — client risk profiles
├── policies            (500 rows) — existing policies
└── claims              (500 rows) — historical claims
```

**Recreate DB if needed:**
```bash
cd /home/mr_e/langflow
source .venv/bin/activate
python data/create_db.py  # Recreates potential_clients (20 rows)
# Then also run:
python data/create_policies.py   # 500 policies
python data/create_claims.py     # 500 claims
```

**Verify DB:**
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('/home/mr_e/langflow/data/insurance_underwriting.sqlite')
for t in ['potential_clients', 'policies', 'claims']:
    n = conn.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
    print(f'{t}: {n} rows')
"
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `[Errno 5] Input/output error` | Langflow process has `/dev/pts/N (deleted)` stdout | Kill all Langflow processes, restart with `nohup ... > langflow.log 2>&1` |
| `API Key not found` / `400 API_KEY_INVALID` | GOOGLE_API_KEY in Langflow global vars is expired/wrong | DELETE `/api/v1/variables/{id}` then POST a new one (PATCH silently fails in 1.8.4) |
| `You do not have permission to run this flow` | Trying to run a "starter project" flow with another user's API key | Only run flows created by the `langflow` user |
| `Error: No authentication credentials` | Missing auth header | Add `Authorization: Bearer $ACCESS` or `x-api-key: $KEY` |
| `requires a valid API key` on `/run/` | Used Bearer token on run endpoint | Use `x-api-key` header for run endpoints |
| Garbled/binary response from curl | Gzip compression | Add `--compressed` to curl commands |
| Flow changes don't persist | PATCH missing `data` field | Include `{"data": flow["data"]}` in PATCH body |
| Multiple Langflow processes on same port | Started twice without cleanup | `pkill -f "langflow run"` then restart |
| `"Error while creating graph from payload: 'data'"` when running a newly-created flow | Edges missing `data.sourceHandle`/`data.targetHandle` parsed dicts | See `flows-api` skill — every edge must have a `data` field with parsed handle objects |

## Agentic Endpoint (v1.8.4 feature)

The `/api/v1/agentic/` endpoint provides a higher-level API:

```bash
# Check if configured
curl -s --compressed "http://127.0.0.1:7860/api/v1/agentic/check-config" \
  -H "Authorization: Bearer $ACCESS"
# Returns: {"configured":true,"configured_providers":["Google Generative AI"]}

# Execute flow by name
curl -s --compressed -X POST "http://127.0.0.1:7860/api/v1/agentic/execute/Insurance%20Underwriting" \
  -H "x-api-key: $LF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "query"}'
```

## OpenAPI Spec

Full API at: `http://127.0.0.1:7860/openapi.json`

Key paths:
- `GET /api/v1/flows/` — list flows
- `POST /api/v1/flows/` — create flow  
- `GET|PATCH|DELETE /api/v1/flows/{flow_id}` — manage flow
- `POST /api/v1/flows/upload/` — upload flow JSON file
- `POST /api/v1/run/{flow_id_or_name}` — run flow (API key required)
- `GET /api/v1/variables/` — list global variables
- `POST|PATCH|DELETE /api/v1/variables/{id}` — manage variables
- `POST /api/v1/api_key/` — create API key
- `GET /api/v1/projects/` — list projects
- `GET /api/v1/monitor/builds` — build history
- `GET /api/v1/monitor/messages` — message history
- `POST /api/v1/build/{flow_id}/flow` — build (returns job_id for polling)
- `GET /api/v1/build/{job_id}/events` — poll build events (SSE)
