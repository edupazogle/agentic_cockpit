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

**Always load the hub SKILL.md first.** Hubs route to sub-skills via decision trees. Never load all sub-skills upfront.

| Task | Load hub | Key sub-skills (loaded on demand) |
|---|---|---|
| Any delivery/implementation | `deliver` + `sprint` | designqa-reviewer (frontend), qa-reviewer (backend) |
| Brainstorm / ideate | `brainstorming` | — |
| UI / visual design | `design` | `brandkit`, `design-taste-frontend`, `minimalist-ui`, etc. |
| Design QA | `designqa` | — |
| Supabase / DB | `supabase` | — |
| Railway / infra | `railway` | — |
| n8n workflows | `n8n` | `n8n-code-javascript`, `n8n-workflow-patterns`, etc. |
| Langflow runtime | `langflow` | `runtime`, `flows-api`, `hitl-resume`, `components`, `custom-components` |
| Langflow code review | `langflow` | `backend-code-review`, `frontend-code-review`, etc. |
| HITL / Chatwoot | `chatwoot` | — |
| Tracing / Langfuse | `langfuse` | — |
| Feature flags | `posthog` | — |
| Telemetry | `otel` | — |
| Skill authoring / code review | `agent-toolkit` | `skill-forge`, `skill-judge`, `code-review-expert` |
| Experiments | `experimentation` | — |
| Repo conventions | `agentic-cockpit` | — |

Discovery: `ls /home/mr_e/agentic/.agents/skills/`
Load hub: Read `.agents/skills/<domain>/SKILL.md`
Load sub-skill: Read `.agents/skills/<domain>/<sub-skill>/SKILL.md`

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
