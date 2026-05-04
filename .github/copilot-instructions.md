> **ARCHITECTURE AUTHORITY:** [`docs/architecture.md`](../docs/architecture.md) is the single source of truth for all technical decisions. When in doubt, `docs/architecture.md` has priority over all other documents, habits, or conventions.

# GDAI Agentic Cockpit — Agent Instructions

## Delivery lifecycle (MANDATORY — no exceptions)

Any request to **deliver**, **implement**, **build**, **execute**, or **test and deliver** a plan, feature, or design MUST go through the full formal lifecycle:

```
/sprint  →  create Linear issues + sprint docs from the plan
/deliver AXA-N  →  review → branch → plan → implement → verify → report
```

**If there is no Linear issue yet:** run `/sprint` first, then `/deliver` on the resulting issue.

**Never implement directly** without: Linear issue + sprint doc + git branch. Skipping any of these is forbidden.

## Skills to load before working in a domain

| Task | Load skill |
|------|-----------|
| Any delivery/implementation | `deliver` + `sprint` |
| UI / design | `design` |
| Design QA | `designqa` |
| Supabase / DB | `supabase` |
| Railway / infra | `railway` |
| n8n workflows | `n8n/*` |
| Langflow | `langflow/runtime` |
| HITL | `chatwoot` |
| Tracing | `langfuse` + `otel` |

Always `ls /home/mr_e/agentic/.agents/skills/` to discover available skills before working in an unfamiliar domain.

## Hard constraints (never override without explicit user instruction)

1. Railway as infra platform
2. Next.js cockpit — do not rewrite UI framework
3. Langflow 1.9 backend-only; n8n stays as MCP-tools layer
4. Two app services: Next.js + Python gateway
5. Single-tenant MVP: `gdai-default`
6. Self-hosted Langfuse from day 1
7. Gateway is the trust boundary — no direct Supabase/LLM calls from Next.js API routes
8. Never edit applied migrations — always create a new migration file
9. Never bypass audit log for pilot or HITL state changes

## Linear project

- **Project:** agentic-cockpit (`9e704a34-31f3-4011-9b9d-3b4759a8ef75`)
- **Team:** AXA GDAI (`b4c393c9-3ca4-4f07-9e11-74589bb9d40b`, key: `AXA`)
- **Milestone:** MVP (`8a67772f-55ea-4bc1-ac66-78241b5fca0a`)
