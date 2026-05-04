## ✅ QA Review — AXA-3: Sprint 0 Repo Recovery Gate

**PR:** https://github.com/edupazogle/agentic_cockpit/pull/1  
**Branch:** `edupazogle/axa-3-sprint-0-repo-recovery-gate`  
**Changed files:** ~40 files across app/, components/, lib/, db/migrations/, docs/, scripts/  
**Reviewer:** GitHub Copilot (qa-reviewer agent)  
**Date:** 2026-05-04

---

### 1. SOLID Principles

| Principle | Status | Notes |
|-----------|--------|-------|
| Single Responsibility (SRP) | ⚠️ | `lib/server/runtime/run-store.ts` (1 355 lines, 38.5 KB) merges N8n dispatch, Chatwoot reconciliation, Supabase storage routing, table persistence, and signature verification. All other files are well-scoped. |
| Open/Closed (OCP) | ✅ | Repository pattern (`SeedScenarioRepository` / `SupabaseScenarioRepository`) and dual `tables`/`storage` persistence mode both support extension without modification. |
| Liskov Substitution (LSP) | ✅ | `SeedScenarioRepository` and `SupabaseScenarioRepository` are fully substitutable through the `ScenarioRepository` interface. |
| Interface Segregation (ISP) | ✅ | `ScenarioRepository` is narrow and purpose-specific. Domain types (`types.ts`) are flat and composable. |
| Dependency Inversion (DIP) | ✅ | Services (`scenarios.ts`, `runs.ts`) depend on the `ScenarioRepository` abstraction. `getScenarioRepository()` factory acts as the composition root. |

---

### 2. Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| No hardcoded secrets (API keys, tokens, passwords) | ⚠️ | No secrets in source. However `run-store.ts` defaults `N8N_CALLBACK_SECRET` to `'agentic-local-callback-secret'` when the env var is absent — a missing env var silently produces a weak default in staging/prod. |
| PII not logged or exposed | ✅ | Claim IDs, vendor names and reserve amounts flow through structured payloads. Synthetic email in HITL route uses `@axa-demo.local` domain, not real addresses. No `console.log(PII)` calls found. |
| Auth boundaries respected | ❌ | **Architectural violation:** `app/api/chatwoot/hitl/route.ts` contains the full Chatwoot integration (contact creation, conversation creation, message posting). Per project rule: *"No business logic in Next.js API routes — they proxy to gateway."* Additionally, the endpoint has **no authentication check** — any unauthenticated caller can POST to `/api/chatwoot/hitl` and create Chatwoot conversations at will. Acceptable as Sprint 0 placeholder (gateway does not exist yet), but must be resolved in Sprint 1. |
| Audit log entries for state changes | ⚠️ | `audit_log` table and hash-chain trigger are defined in migration `0005`. However the runtime (`run-store.ts`) writes run state changes directly to `scenario_runs` without inserting an `audit_log` row, violating: *"Any write via service-role from outside the gateway must write an audit_log row."* |
| No SQL injection or XSS vectors | ✅ | All Supabase interactions use parameterised query strings via `supabaseSelect`/`supabaseRequest`. The Zod schema in `callback-routes.ts` validates all n8n callback inputs. No raw SQL concatenation found. |

---

### 3. Code Quality

| Check | Status | Notes |
|-------|--------|-------|
| DRY — no unnecessary duplication | ⚠️ | `scenarioToken()` helper is duplicated verbatim between `run-store.ts` (line 217) and `chat-webhook.ts` (line 78) with slightly different token mappings. |
| Cyclomatic complexity acceptable | ⚠️ | `run-store.ts` has very high cyclomatic complexity inside `ingestRunCallback`, `reconcileOperatorArtifacts`, and `dispatchRunToN8n`. Acceptable for Sprint 0 but flagged for refactor. |
| Dead code removed | ⚠️ | `components/scenario/scenario-workspace.tsx.bak` is a backup artifact left in the repository tree. |
| Tests present and meaningful | ❌ | `package.json` declares `"test": "vitest"` but `vitest` is not in `devDependencies` and **no test files exist** anywhere in the repository. The 80%+ coverage requirement is entirely unmet. |
| Comments only on non-obvious intent | ✅ | Comments are sparse and appropriate. The `chatwoot/hitl/route.ts` JSDoc block correctly explains the Sprint 0 intent. |

---

### 4. Removal Candidates

| Item | Type | Recommended action |
|------|------|--------------------|
| `components/scenario/scenario-workspace.tsx.bak` | Dead backup file | Remove — the active `scenario-workspace.tsx` supersedes it |
| `../imane/.env`, `../imane/.env.local`, `../imane/scrollytelling/app/.env.local` in `chat-webhook.ts` `loadEnvFallback()` | Developer-specific local paths hardcoded in production code | Remove the `imane` path entries; keep only generic `.env` / `.env.local` fallbacks |
| `scenarioToken()` in `run-store.ts` (duplicates `chat-webhook.ts`) | Duplicated utility function | Extract to a shared module and remove the duplicate |

---

### Summary

This is a Sprint 0 "repo recovery" delivery that restores and extends the Next.js cockpit skeleton with a solid repository pattern, dual-mode Supabase persistence (tables and object storage), HMAC-signed N8n callbacks, 8 idempotent database migrations, and a complete tenant/RLS schema. The overall structure is architecturally sound for the foundation it sets.

Three issues stand out: (1) the HITL Chatwoot endpoint places business logic directly in a Next.js API route — a hard architectural violation per project rules, though explicable for Sprint 0 since the Python gateway does not exist yet; (2) there are zero test files despite `vitest` being declared in `scripts`; (3) state changes to `scenario_runs` bypass the `audit_log` hash chain entirely.

### Recommendation

🟡 **Merge with caution** — Sprint 0 scope (repo skeleton, migrations, seed-mode fallback, runtime callbacks, HITL bridge placeholder) is satisfied. Three items should be converted to Sprint 1 acceptance criteria before the next gate:

1. **Move HITL logic to Python gateway** and add authentication on the interim endpoint.
2. **Add `audit_log` writes** for all `scenario_runs` state transitions performed outside the gateway.
3. **Bootstrap Vitest** with at minimum smoke tests for `run-store` and `callback-routes`.

The `.bak` file and duplicated `scenarioToken` are low-effort housekeeping addressable in a single Sprint 1 PR.

---

_Reply `/approve-merge` to merge and close, or `/request-changes` to return to In Progress._
