# Refactor Execution Notes — Sprint 0

## Run-Store Hazards Identified

### H-01: Event Delete/Reinsert
**Location:** `lib/server/run-store.ts` — child events deleted and reinserted on status changes
**Issue:** Violates append-only audit semantics.
**Risk:** Lost callback data, audit trail gaps, race conditions.
**Resolution:** S1 migration 0009 will add `events` table with idempotency keys and append-only constraint.

### H-02: Missing Orchestrator Persistence
**Location:** `lib/server/run-store.ts` — orchestrator field not used
**Issue:** Orchestrator selection (n8n vs Langflow) is not persisted on `scenario_runs` at creation time.
**Risk:** Replay/retry may use wrong runtime.
**Resolution:** S1 will add immutable `orchestrator` column and default logic.

### H-03: Missing Optimistic Concurrency
**Location:** All `run-store.ts` update functions
**Issue:** No version checking for concurrent updates to `scenario_runs.status` or `node_states`.
**Risk:** Lost updates, inconsistent state, duplicate side effects.
**Resolution:** S1 will add `updated_at` timestamp checks and retry logic.

### H-04: Direct n8n Dispatch
**Location:** `lib/server/run-store.ts` — client-facing API routes directly call n8n
**Issue:** Service-role key exposure, no audit trail, no retry/timeout strategy.
**Risk:** Credential leakage, untraceable side effects.
**Resolution:** S1 gateway will own all orchestrator dispatch; Next.js routes proxy to gateway.

## Known Constraints

- `delete/` prototype uses Next.js 14; root app uses Next.js 16 (App Router stable).
- Service-role key is currently in client-bundle scope (to be removed in S1).
- No RLS enforcement on `scenario_runs` or `events` in local dev (hardcoded `gdai-default` tenant).
- Legacy route `/scenario/[scenarioKey]` preserved for S0/S1; removal decision deferred to S4 review.

## S0 Decisions

| Decision | Rationale |
|---|---|
| Keep `delete/` as archive for one sprint | Safer rollback if restoration breaks critical paths. Remove in S1. |
| pnpm over npm/yarn | Faster installs, better monorepo support, Railway compatible. |
| No gateway in S0 | Gateway trust boundary is S1 deliverable; S0 focuses on repo shape. |
| CI skeleton vs full pyramid | Full contract/integration/e2e tests require gateway API contracts (S1+). |
