---
name: langflow/custom-components
description: >
  Author, load, validate, and catalog Langflow custom components for the GDAI Agentic Cockpit.
  Use whenever creating a new custom component, iterating on one, or checking how to wire
  a custom output type into a flow. Includes the full authoring template, input/output type
  reference, hot-reload procedure, validation checklist, and the mandatory catalog update step.
applyTo: "**/langflow/components/**/*.py"
---

# Langflow Custom Components — GDAI Skill

## 1. Directory Layout

All custom components live under `/home/mr_e/langflow/components/`.
Each category is a Python package (folder with `__init__.py`).

```
/home/mr_e/langflow/components/
├── axa/                          # AXA-domain components (claim triage, etc.)
│   ├── __init__.py
│   └── claim_triage.py
├── hitl/                         # Human-in-the-loop components
│   ├── __init__.py
│   └── hitl_gate.py
├── scorers/                      # Evaluation / scoring
│   ├── __init__.py
│   └── braintrust_scorer.py
└── testing/                      # Sandbox/tests — don't use in production flows
    ├── __init__.py
    └── hello_world.py
```

Langflow picks them all up because the server is started with:
```
LANGFLOW_COMPONENTS_PATH="/home/mr_e/langflow/components"
```
The API registry key for a category is its folder name (e.g. `axa`, `hitl`).

---

## 2. Component Anatomy

```python
from langflow.custom import Component
from langflow.io import MessageTextInput, DropdownInput, Output   # see §4
from langflow.schema import Data                                  # or Message, DataFrame

class MyComponent(Component):
    # --- Identity ---
    display_name = "My Component"        # shown in the palette
    description  = "One-sentence description visible in UI tooltip."
    icon         = "some-lucide-name"    # see https://lucide.dev/icons/
    name         = "MyComponent"         # must match class name; used as node type key

    # --- Inputs ---
    inputs = [
        MessageTextInput(
            name="user_text",
            display_name="User Text",
            info="Help text shown below the field.",
            required=True,
            tool_mode=True,   # expose as an LLM tool parameter
        ),
        DropdownInput(
            name="tier",
            display_name="Processing Tier",
            options=["fast", "standard", "deep"],
            value="standard",
        ),
    ]

    # --- Outputs ---
    outputs = [
        Output(
            display_name="Result",
            name="result",
            method="run",        # must match the method name below
        ),
    ]

    # --- Implementation ---
    def run(self) -> Data:                # return type drives the edge "output_types"
        # self.<input_name> accesses the live value of each input
        result = {"value": self.user_text, "tier": self.tier}
        self.status = f"Done ({self.tier})"  # shown on the node status badge
        return Data(data=result)
```

### Key rules
1. The method name in `Output(method=...)` must exactly match the Python method name.
2. `self.status = "..."` sets the green/red badge text visible in the flow builder.
3. Return type must be one of: `Message`, `Data`, `DataFrame`, `str`, or a Langchain runnable.
4. Class name (= `name` field) = the registry key used in API payloads.

---

## 3. Input Types Reference

| Class | Import path | When to use |
|---|---|---|
| `MessageTextInput` | `langflow.io` | Free text, including multi-line strings and Message pass-through |
| `TextInput` | `langflow.io` | Simple string (no Message type support) |
| `IntInput` | `langflow.io` | Integer value |
| `FloatInput` | `langflow.io` | Float value |
| `BoolInput` | `langflow.io` | Boolean toggle |
| `DropdownInput` | `langflow.io` | Fixed option list — requires `options=[...]` and `value="default"` |
| `MultiselectInput` | `langflow.io` | Multiple-choice list |
| `SecretStrInput` | `langflow.io` | Password / API key — masked in UI, loaded from env |
| `DataInput` | `langflow.io` | Accepts a `Data` object from an upstream component |
| `MessageInput` | `langflow.io` | Accepts a `Message` from upstream |
| `FileInput` | `langflow.io` | File upload — returns path |
| `HandleInput` | `langflow.io` | Arbitrary connection handle (for passing runnables/chains) |
| `DictInput` | `langflow.io` | JSON dict |
| `CodeInput` | `langflow.io` | Multi-line code editor |
| `PromptInput` | `langflow.io` | Prompt template (not for connecting to upstream nodes) |

All inputs accept these common keyword args:
- `name` (required) — Python attribute name
- `display_name` (required) — UI label
- `info` — help text shown in UI
- `required=True/False` — default False
- `value="default"` — pre-filled value
- `tool_mode=True` — expose the field as an LLM tool parameter (needed for AgentComponent routing)
- `advanced=True` — collapse field into "Advanced" drawer

---

## 4. Output Types

| Return type | Use for | Edge output_types value |
|---|---|---|
| `Message` | Chat messages, text responses | `["Message"]` |
| `Data` | Structured dicts / records | `["Data"]` |
| `DataFrame` | Tabular data | `["DataFrame"]` |
| `str` | Plain strings | `["Text"]` |
| Langchain `Runnable` | Pass chain/retriever to Agent | `["Runnable"]` |
| `BaseLanguageModel` | Pass model to downstream | `["LanguageModel"]` |

---

## 5. Hot-Reload Procedure

Langflow watches `LANGFLOW_COMPONENTS_PATH` at startup — **it does not hot-reload on file save**.

After adding or editing a component:

```bash
pkill -f "langflow run"
cd /home/mr_e/langflow
LANGFLOW_DATABASE_URL="sqlite:////home/mr_e/langflow/.venv/lib/python3.12/site-packages/langflow/langflow.db" \
LANGFLOW_COMPONENTS_PATH="/home/mr_e/langflow/components" \
nohup .venv/bin/langflow run --host 127.0.0.1 --port 7860 --no-open-browser > langflow.log 2>&1 &

# Wait for it
until curl -s http://127.0.0.1:7860/api/v1/auto_login > /dev/null; do sleep 2; done
echo "Ready"
```

---

## 6. Validating a Component Loaded

```python
import requests

BASE = "http://127.0.0.1:7860"
token = requests.get(f"{BASE}/api/v1/auto_login").json()["access_token"]
all_comps = requests.get(f"{BASE}/api/v1/all",
                         headers={"Authorization": f"Bearer {token}"}).json()

# The category key is the directory name
for name, comp in all_comps.get("axa", {}).items():
    print(name, "→", comp["display_name"])
```

Or with curl:
```bash
TOKEN=$(curl -s http://127.0.0.1:7860/api/v1/auto_login | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:7860/api/v1/all \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(n) for n in d.get('axa',{})]"
```

---

## 7. Wiring a Custom Component into a Flow via API

When building flows programmatically (`flows-api` skill), a custom component node is created
exactly like a built-in one. The only difference: look up its registry entry from `GET /api/v1/all`
under its category key (folder name), not under the generic categories.

```python
all_comps = requests.get(f"{BASE}/api/v1/all", headers=auth).json()
claim_triage = all_comps["axa"]["ClaimTriageComponent"]

# make_node() from flows-api skill works unchanged:
ct_node = make_node("ClaimTriageComponent", "ClaimTriageComponent-abc01",
                    {"x": 500, "y": 300},
                    overrides={"claim_id": "CLM-042"})
```

Edge output_types for `ClaimTriageComponent`:
- output `triage_result` → `["Data"]`

Downstream `ChatOutput.input_value` accepts `["Data","DataFrame","Message"]`, so the edge connects directly.

---

## 8. AXA Claim Triage Component (reference)

**File:** `/home/mr_e/langflow/components/axa/claim_triage.py`

**Purpose:** Keyword-based triage of free-text claim descriptions. Returns structured `Data`
with `severity`, `category`, `requires_human_review`, and `raw_text`.

| Input | Required | Type | Notes |
|---|---|---|---|
| `claim_text` | ✓ | `MessageTextInput` | Free-text claim description |
| `claim_id` | | `MessageTextInput` | Passed through to output; default empty |
| `default_category` | | `DropdownInput` | Used when no keyword matches; default `Other` |

| Output | Type | Notes |
|---|---|---|
| `triage_result` | `Data` | `{claim_id, severity, category, raw_text, requires_human_review}` |

**Severity tiers** (first keyword match wins):
| Tier | Example keywords |
|---|---|
| `critical` | death, total loss, fire, flood, explosion |
| `high` | hospitalised, surgery, major damage, theft, fraud |
| `medium` | injury, broken, damaged, accident, leak |
| `low` | scratch, minor, cosmetic, dent, delay |

**Categories:** Motor Vehicle, Property Damage, Personal Injury, Medical / Health, Travel, Liability, Other.

**Test flow:** `http://127.0.0.1:7860/flow/7e5390d1-fe85-4767-9c2c-2f31e05ec9a0`
(ChatInput → AXA Claim Triage → ChatOutput — 3 test cases verified correct)

---

## 9. Definition of Done for a New Custom Component

When you finish creating and validating a custom component:

1. ✅ File exists at `/home/mr_e/langflow/components/<category>/<name>.py`
2. ✅ `__init__.py` exports the class
3. ✅ Component appears in `GET /api/v1/all` under `<category>`
4. ✅ A test flow has been run with at least one successful API call
5. ✅ **Run the catalog regeneration script** to update the components skill:
   ```bash
   cd /home/mr_e/agentic
   python3 scripts/regen-langflow-catalog.py
   ```
6. ✅ Add a row to the **§ 8 component reference table** above (or a new section if a new category)

---

## 10. Catalog Regeneration Script

**File:** `/home/mr_e/agentic/scripts/regen-langflow-catalog.py`

This script queries `GET /api/v1/all` and regenerates
`/home/mr_e/agentic/.agents/skills/langflow/components/SKILL.md`.

Run it whenever:
- A new custom component is added
- A built-in component is discovered with incorrect/missing documentation
- Langflow is upgraded to a new version

```bash
cd /home/mr_e/agentic
python3 scripts/regen-langflow-catalog.py
# → writes .agents/skills/langflow/components/SKILL.md
# → prints a summary of how many components per category
```

The script preserves the YAML frontmatter and the Composio appendix at the end of the file.

---

## 11. Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Component not in palette after saving | Langflow doesn't hot-reload | Kill + restart Langflow (§5) |
| `AttributeError: 'ClaimTriageComponent' has no attribute 'claim_text'` | `name=` field in input doesn't match `self.<name>` access | Check the `name` kwarg on the input |
| `"Error while creating graph from payload: 'data'"` | Edge missing `data` field | Add `data: {sourceHandle:..., targetHandle:...}` (see `flows-api` skill) |
| Component appears with wrong category in UI | Folder name sets the registry key | Rename folder and restart |
| `Output(method="run")` raises AttributeError | Method name doesn't match | Check spelling exactly — case-sensitive |
| `self.status` not visible | Normal — status only shows after first run | Run the flow once |
| `tool_mode=True` not working in Agent | Input type doesn't support tool_mode | Use `MessageTextInput` or `TextInput` (not `DataInput`) |
