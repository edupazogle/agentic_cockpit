---
name: langfuse
description: >
  Interact with Langfuse for the GDAI Agentic Cockpit. Use when (1) wiring @observe() tracing in
  the gateway, propagating trace IDs to scenario_runs, or connecting Langfuse to Langflow runs;
  (2) querying or modifying Langfuse data via CLI — traces, prompts, datasets, scores, evals;
  (3) looking up Langfuse documentation or SDK usage. Self-hosted instance at
  http://127.0.0.1:3000 (dev) / private Railway domain (prod). Triggers: "trace", "observe",
  "langfuse", "dataset", "eval", "prompt registry", "LLM judge", "score a trace".
---

# Langfuse — GDAI Agentic Cockpit

This skill covers wiring Langfuse tracing into the gateway, managing prompts/datasets/evals, and querying data programmatically.

## Self-hosted instance (this project)

| Environment | URL | Auth |
|---|---|---|
| Local dev | `http://127.0.0.1:3000` | |
| Railway prod | `http://${{ langfuse-web.RAILWAY_PRIVATE_DOMAIN }}:3000` | private |

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...          # from Railway env / .env.local
export LANGFUSE_SECRET_KEY=sk-lf-...
export LANGFUSE_HOST=http://127.0.0.1:3000    # local; override for prod
```

OTel basic-auth header: `base64(public_key:secret_key)` → `LANGFUSE_BASIC_AUTH_B64`.

## GDAI tracing conventions

**Every gateway function that touches user input or calls an LLM/tool must have `@observe()`.**

```python
from langfuse.decorators import observe, langfuse_context

@observe()
async def run_flow(run_id: str, claim_text: str) -> dict:
    # Attach custom metadata to the current span
    langfuse_context.update_current_observation(
        metadata={"run_id": run_id, "tenant_id": "gdai-default"},
        tags=["property-fast-track"],
    )
    result = await langflow_client.run(...)
    # Propagate trace ID to scenario_runs for cockpit deep-link
    trace_id = langfuse_context.get_current_trace_id()
    await run_store.update(run_id, {"langfuse_trace_id": trace_id})
    return result
```

**No PII in trace inputs/outputs.** The OTel collector redacts on ingress but write defensively — never put `policyholder_name`, `email`, `iban`, `plate` in span attributes.

## NEVER

- **Never put `service_role` key or database credentials in trace metadata** — they appear in Langfuse UI.
- **Never use Langfuse Cloud EU** — self-hosted only (data residency, Q-decision §9.6).
- **Never skip `@observe()` on a function that calls an LLM** — uncovered calls create invisible cost and latency blind spots.
- **Never replay `reasoning_content`** from NIM responses as trace `input` or `output` — it's internal chain-of-thought, not a user-visible artifact.
- **Never hard-code `LANGFUSE_HOST`** in gateway source — always read from env.

## LLM-judge evals (3 rubrics)

The three judge rubrics live as Langfuse **datasets** + **prompts**:

| Rubric | Dataset name | Metric |
|---|---|---|
| Factual accuracy | `eval-factual-accuracy` | binary pass/fail |
| Policy compliance | `eval-policy-compliance` | 0–1 score |
| Tone | `eval-tone` | 0–1 score |

Run evals:
```bash
cd /home/mr_e/agentic/gateway
uv run python scripts/eval_runner.py --dataset eval-factual-accuracy
```

A 4th rubric is locked for v1.1 — do not add it yet.

## Core Principles

1. **Documentation First** — fetch current docs before writing SDK code (Langfuse updates frequently).
2. **CLI for Data Access** — use `langfuse-cli` for querying/modifying data, not ad-hoc API calls.
3. **Use latest SDK versions** unless the user specifies otherwise.

## Use-case references (load on demand)

- Instrumenting a function/application: fetch `https://langfuse.com/docs/sdk/python/decorators.md`
- Migrating prompts from code into Langfuse: fetch `https://langfuse.com/docs/prompts/get-started.md`
- Capturing user feedback as scores: fetch `https://langfuse.com/docs/scores/user-feedback.md`
- SDK upgrade guidance: fetch `https://langfuse.com/changelog.md`

## 1. Langfuse API via CLI

Use the `langfuse-cli` to interact with the full Langfuse REST API from the command line. Run via npx (no install required):

Start by discovering the schema and available arguments:

```bash
# Discover all available resources
npx langfuse-cli api __schema

# List actions for a resource
npx langfuse-cli api <resource> --help

# Show args/options for a specific action
npx langfuse-cli api <resource> <action> --help
```

### Credentials

Set environment variables before making calls:

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...
export LANGFUSE_SECRET_KEY=sk-lf-...
export LANGFUSE_HOST=https://cloud.langfuse.com # example for EU cloud. For US cloud it's us.cloud.langfuse.com, and can also be a self-hosted URL. The server must always be specified in order to access Langfuse.
```

If not set, ask the user for their API keys (found in Langfuse UI → Settings → API Keys).

### Detailed CLI Reference

For common workflows, tips, and full usage patterns, see [references/cli.md](references/cli.md).

## 2. Langfuse Documentation

Three methods to access Langfuse docs, in order of preference. **Always prefer your application's native web fetch and search tools** (e.g., `WebFetch`, `WebSearch`, `mcp_fetch`, etc.) over `curl` when available. The URLs and patterns below work with any fetching method — the `curl` examples are just illustrative.

### 2a. Documentation Index (llms.txt)

Fetch the full index of all documentation pages:

```bash
curl -s https://langfuse.com/llms.txt
```

Returns a structured list of every doc page with titles and URLs. Use this to discover the right page for a topic, then fetch that page directly.

Alternatively, you can start on `https://langfuse.com/docs` and explore the site to find the page you need.

### 2b. Fetch Individual Pages as Markdown

Any page listed in llms.txt can be fetched as markdown by appending `.md` to its path or by using `Accept: text/markdown` in the request headers. Use this when you know which page contains the information needed. Returns clean markdown with code examples and configuration details.

```bash
curl -s "https://langfuse.com/docs/observability/overview.md"
curl -s "https://langfuse.com/docs/observability/overview" -H "Accept: text/markdown"
```

### 2c. Search Documentation

When you need to find information across all docs and github issues/discussions without knowing the specific page:

```bash
curl -s "https://langfuse.com/api/search-docs?query=<url-encoded-query>"
```

Example:

```bash
curl -s "https://langfuse.com/api/search-docs?query=How+do+I+trace+LangGraph+agents"
```

Returns a JSON response with:

- `query`: the original query
- `answer`: a JSON string containing an array of matching documents, each with:
  - `url`: link to the doc page
  - `title`: page title
  - `source.content`: array of relevant text excerpts from the page

Search is a great fallback if you cannot find the relevant pages or need more context. Especially useful when debugging issues as all GitHub Issues and Discussions are also indexed. Responses can be large — extract only the relevant portions.

### Documentation Workflow

1. Start with **llms.txt** to orient — scan for relevant page titles
2. **Fetch specific pages** when you identify the right one
3. Fall back to **search** when the topic is unclear and you want more context

## Skill Feedback

When the user expresses that something about this skill is not working as expected, gives incorrect guidance, is missing information, or could be improved — offer to submit feedback to the Langfuse skill maintainers. This includes when:

- The skill gave wrong or outdated instructions
- A workflow didn't produce the expected result
- The user wishes the skill covered something it doesn't
- The user explicitly says something like "this should work differently" or "this is wrong"

**Do NOT trigger this** for issues with Langfuse itself (the product) — only for issues with this skill's instructions and behavior.

When triggered, follow the process in [references/skill-feedback.md](references/skill-feedback.md).
