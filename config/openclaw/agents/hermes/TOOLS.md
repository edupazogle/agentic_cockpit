# Hermes — Tool Manifest

## Core Tools (MVP)

### Cockpit Queries

| Tool | Description | Backend |
|---|---|---|
| `list_pilots(country)` | List all pilots for a country with level, domain, status | Gateway → Supabase `pilots` |
| `get_pilot(slug)` | Full pilot detail including KPIs, gates, recent runs | Gateway → Supabase + `scenario_runs` |
| `aggregate_kpis(country)` | Three-pillar KPI aggregation (Business, Operational, Quality) | Gateway → Supabase `kpi_snapshots` |
| `get_kpi_detail(pilot_slug)` | Per-pilot KPI breakdown with trends | Gateway → Supabase + Langfuse |
| `get_agent_topology(pilot_slug)` | Agent node graph with pass rates, latency, cost per node | Gateway → Supabase `scenario_members` |
| `get_heatmap(country)` | HITL gate trigger frequency by gate × severity | Gateway → Supabase `hitl_items` (aggregated) |
| `get_landing_config(country)` | Bento module configuration for the landing page | Gateway → Supabase `countries.bento_config` |

### HITL Operations

| Tool | Description | Backend |
|---|---|---|
| `list_hitl_queue(country)` | All pending HITL cases, ranked by SLA urgency | Gateway → Supabase `hitl_items` |
| `get_decision(packet_id)` | Full decision context: evidence, AI reasoning, cost-if-wrong | Gateway → Supabase `hitl_items` + `decisions` |
| `submit_decision(packet_id, decision, reason?)` | Approve, override, or escalate a HITL decision | Gateway → Supabase + `audit_log` |

### Documentation

| Tool | Description | Backend |
|---|---|---|
| `draft_status_update(country)` | Draft a weekly/monthly status update across all pilots | LLM-generated, Supabase-sourced |
| `summarize_runs(pilot_slug, days)` | Summarize recent runs: pass/fail, latency trends, gate triggers | Gateway → Supabase + Langfuse |

## Extended Tools (Post-MVP)

### Research & Citations

| Tool | Description | Backend |
|---|---|---|
| `search_regulatory_corpus(query, jurisdiction)` | Search curated regulatory KB (exact + semantic) | Gateway → Supabase `regulatory_corpus` |
| `lookup_regulation(ref)` | Get exact text of a specific regulation article | Gateway → Supabase `regulatory_corpus` |
| `search_web_insurance(query)` | Live web search (allowlisted domains: eiopa, acpr, ffa, eur-lex) | Post-MVP: Tavily |

### Composition (Pilot Building)

| Tool | Description | Backend |
|---|---|---|
| `propose_pilot(description)` | Create a draft pilot from conversation | Gateway → Supabase `pilots` + `cockpit_scenarios` |
| `seed_synth_data(pilot_slug, config)` | Generate synthetic data for a pilot | Gateway → synthdata factories |
| `generate_business_case(pilot_slug)` | Compute ROI from gate costs + volumes + accuracy targets | Gateway → LLM computation |
| `lint_capability_manifest(manifest)` | OPA-style policy check on generated bundles | Gateway → security_lint.py |

### Communication

| Tool | Description | Backend |
|---|---|---|
| `generate_deck(topic, format)` | Generate executive presentation (PPTX/PDF) | LLM-generated |
| `generate_compliance_memo(pilot_slug)` | Draft compliance memo for legal/risk review | LLM-generated, citation-verified |
| `push_decision_packet(packet_id, channel)` | Push HITL decision to external system | Post-MVP: Teams/SF/ServiceNow adapter |

## Tool Call Format

All tool calls use OpenAI-compatible function calling:

```json
{
  "name": "list_pilots",
  "arguments": {
    "country": "fr"
  }
}
```

## Tool Constraints

- **Rate limit:** 10 tool calls per user message. Hard stop at limit.
- **Budget:** Every tool call increments `chat_thread.total_cost_eur`. Hard pause at budget ceiling.
- **Citation gate:** Any response containing a regulatory reference flows through the Citation Verification Gate before reaching the user.
- **Audit:** Every tool call → Langfuse span. Every write → `audit_log` row.
- **Sandbox:** Non-admin sessions execute tools in Docker sandbox with allowlisted egress endpoints.
