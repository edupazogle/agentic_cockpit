---
name: langflow
description: "Langflow agent orchestration platform. Use when working with Langflow runtime, flows, components, HITL patterns, or custom component development. Triggers: /langflow, langflow, flow, agent, orchestration, hitl, insurance underwriting"
---

# Langflow Hub

IRON LAW: Never modify a running flow without first reading its current state via the flows API. Always test flows with test_workflow before deploying.

## Sub-Skill Catalog

| User says... | Load sub-skill |
|---|---|
| "start/stop langflow", "auth", "list flows", "check health", "credentials" | `runtime/SKILL.md` |
| "run a flow", "execute flow", "call flow API", "session", "webhook trigger" | `flows-api/SKILL.md` |
| "HITL", "pause flow", "resume flow", "human in the loop", "HitlGate" | `hitl-resume/SKILL.md` |
| "what components exist", "find a component", "component list", "catalog" | `components/SKILL.md` |
| "build a component", "custom component", "new component", "component authoring" | `custom-components/SKILL.md` |
| "review langflow code", "code review backend langflow" | `backend-code-review/SKILL.md` |
| "review langflow UI code", "code review frontend langflow" | `frontend-code-review/SKILL.md` |
| "refactor langflow component", "component refactoring" | `component-refactoring/SKILL.md` |
| "e2e test langflow", "end-to-end test langflow" | `e2e-testing/SKILL.md` |
| "frontend query langflow", "API client pattern langflow" | `frontend-query-mutation/SKILL.md` |
| "frontend test langflow", "UI component test langflow" | `frontend-testing/SKILL.md` |

## Decision Tree

1. Is this about **running/operating** Langflow? → `runtime/SKILL.md`
2. Is this about **executing flows** via API? → `flows-api/SKILL.md`
3. Is this about **HITL/pause/resume**? → `hitl-resume/SKILL.md`
4. Is this about **finding/using components**? → `components/SKILL.md`
5. Is this about **building custom components**? → `custom-components/SKILL.md`
6. Is this about **reviewing Langflow source code**? Check scope:
   - Backend Python? → `backend-code-review/SKILL.md`
   - Frontend React/TS? → `frontend-code-review/SKILL.md`
   - Component refactoring? → `component-refactoring/SKILL.md`
   - E2E tests? → `e2e-testing/SKILL.md`
   - API client patterns? → `frontend-query-mutation/SKILL.md`
   - UI component tests? → `frontend-testing/SKILL.md`

## Related Domains

Before executing, check if the task touches:
- **Database/persistence** → also load `../supabase/SKILL.md`
- **External tools/APIs** → also load `../n8n/SKILL.md`
- **Deployment** → also load `../railway/SKILL.md`
- **Tracing/observability** → also load `../langfuse/SKILL.md`
- **Feature flags** → also load `../posthog/SKILL.md`

## Anti-Patterns

- NEVER guess a flow ID — always look it up via runtime skill
- NEVER modify component code without loading custom-components skill
- NEVER skip test_workflow before deploying a flow change
- NEVER hard-code API keys in flow JSON — use Langflow global variables
- NEVER upload flow JSON without validating via `lfx validate`

## Confirmation Gates

⛔ ASK before: restarting Langflow server, modifying production flows, deleting components, credential changes
