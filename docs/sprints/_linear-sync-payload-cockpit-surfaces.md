# Linear Sync Payload — Cockpit Surfaces (S13–S16)

> **Generated from:** `docs/superpowers/specs/2026-05-05-cockpit-surfaces-ux-design.md` + `docs/architecture.md` §21, §22, §23
> **Date:** 2026-05-05
> **Status:** Ready for Linear MCP application

## Sprint 13 — Cockpit Shell: Landing + Sphere + Scenarios

| Issue ID | Title | Priority | Labels | Blocked by |
|---|---|---|---|---|
| COCKPIT-001 | CockpitShell + TopBar + TabBar + CountrySelector | High | `frontend`, `cockpit-shell` | S12 |
| COCKPIT-002 | SphereCompanion + RadialMenu + CompanionNudge | High | `frontend`, `cockpit-shell`, `signature` | COCKPIT-001 |
| COCKPIT-003 | ChatSlideOver + ChatMessage + ChatComposer | High | `frontend`, `cockpit-shell`, `chat` | COCKPIT-001 |
| COCKPIT-004 | LandingBento + 10 bento modules (KPIHeroStrip, ActivePilotsGrid, …) | High | `frontend`, `landing` | COCKPIT-001 |
| COCKPIT-005 | ScenarioGrid + ScenarioCard + ScenarioFilters | High | `frontend`, `scenarios` | COCKPIT-001 |
| COCKPIT-006 | Gateway: cockpit routes (countries, landing, scenarios, chat thread) | High | `backend`, `gateway` | — |
| COCKPIT-007 | Supabase: migrations 0017–0020 (countries, country_users, blueprints, chat_threads_country) | High | `backend`, `database` | — |
| COCKPIT-008 | Langfuse: country companion prompts (charter, landing, scenarios, nudge) | Medium | `ai`, `prompts` | COCKPIT-002, COCKPIT-003 |
| COCKPIT-009 | E2E: 9 AC Playwright tests for S13 | High | `testing`, `e2e` | COCKPIT-001…006 |

## Sprint 14 — KPI Dashboard + Agent-Level Drill-Down

| Issue ID | Title | Priority | Labels | Blocked by |
|---|---|---|---|---|
| COCKPIT-010 | KPIDashboard + PillarCard + KPINumber components | High | `frontend`, `kpi-dashboard` | S13 |
| COCKPIT-011 | PerPilotTable + AgentLevelAnalysis + AgentNodeInspector | High | `frontend`, `kpi-dashboard` | COCKPIT-010 |
| COCKPIT-012 | BusinessImpactRow + companion KPI insight generation | Medium | `frontend`, `kpi-dashboard`, `ai` | COCKPIT-010 |
| COCKPIT-013 | Gateway: KPI routes + aggregation logic (per-country, per-pilot, per-agent) | High | `backend`, `gateway` | — |
| COCKPIT-014 | KPI snapshotter cron + WebSocket kpi_update channel | High | `backend`, `infrastructure` | COCKPIT-013 |
| COCKPIT-015 | Supabase: migration 0021 (kpi_snapshots) | High | `backend`, `database` | — |
| COCKPIT-016 | E2E: KPI AC Playwright tests (5 ACs) | High | `testing`, `e2e` | COCKPIT-010…014 |

## Sprint 15 — HITL Chat + Decision Packets

| Issue ID | Title | Priority | Labels | Blocked by |
|---|---|---|---|---|
| COCKPIT-017 | DecisionPacket + SLATimer + Approve/Override/Escalate workflow | High | `frontend`, `hitl-chat`, `signature` | S14 |
| COCKPIT-018 | CitationChip + ArtifactCard + ThinkingIndicator | High | `frontend`, `hitl-chat` | COCKPIT-003 |
| COCKPIT-019 | ChatMessage + ChatComposer + message types (user/companion/system) | High | `frontend`, `hitl-chat` | COCKPIT-003 |
| COCKPIT-020 | Gateway: chat routes + country companion tools (5 new tools) | High | `backend`, `gateway`, `ai` | COCKPIT-006 |
| COCKPIT-021 | Langfuse: country companion prompts (kpis, chat, decision, 5 tool prompts) | Medium | `ai`, `prompts` | COCKPIT-020 |
| COCKPIT-022 | External escalation adapter interface + mock (no-op) implementation | High | `backend`, `architecture` | COCKPIT-020 |
| COCKPIT-023 | E2E: HITL chat AC Playwright tests (5 ACs) | High | `testing`, `e2e` | COCKPIT-017…021 |

## Sprint 16 — External Escalation Adapters + Blueprint Library

| Issue ID | Title | Priority | Labels | Blocked by |
|---|---|---|---|---|
| COCKPIT-024 | BlueprintLibrary + BlueprintCard + import flow | High | `frontend`, `blueprint` | S15 |
| COCKPIT-025 | ExternalToolConfig admin panel + DeliveryStatusBadge | Medium | `frontend`, `admin` | COCKPIT-022 |
| COCKPIT-026 | Gateway: blueprint routes + import logic + companion gate-check | High | `backend`, `gateway`, `ai` | COCKPIT-006 |
| COCKPIT-027 | Gateway: external escalation routes + admin config | High | `backend`, `gateway` | COCKPIT-022 |
| COCKPIT-028 | Teams adapter: Adaptive Card webhook integration | Medium | `backend`, `integration` | COCKPIT-022 |
| COCKPIT-029 | Salesforce adapter: Case REST integration | Medium | `backend`, `integration` | COCKPIT-022 |
| COCKPIT-030 | ServiceNow adapter: Incident REST integration | Medium | `backend`, `integration` | COCKPIT-022 |
| COCKPIT-031 | Supabase: migration 0022 (notification_prefs) | Medium | `backend`, `database` | — |
| COCKPIT-032 | E2E: blueprint + external escalation AC tests | High | `testing`, `e2e` | COCKPIT-024…030 |

## Issue summary

| Sprint | Issues | Frontend | Backend | Database | AI/Prompts | Testing |
|---|---|---|---|---|---|---|
| S13 | 9 | 5 | 1 | 1 | 1 | 1 |
| S14 | 7 | 3 | 1 | 1 | 0 | 2 (cron + WS counted in backend) |
| S15 | 7 | 3 | 1 | 0 | 1 | 2 (adapter counted in backend) |
| S16 | 9 | 2 | 2 | 1 | 0 | 4 (3 adapters + e2e) |
| **Total** | **32** | **13** | **5** | **3** | **2** | **4** (+5 infrastructure/adapter issues cross-counted) |

## Application instructions

These issues should be created in the Linear project "INGEST" (per CLAUDE.md reference memory) under the team with label `cockpit-surfaces`. All issues use the `post-mvp` cycle. Parent/child blocking relationships defined above.

**Apply via:** Linear MCP `save_issue` tool (one per issue) or bulk import.
