# Sprint 14 — KPI Dashboard + Agent-Level Drill-Down

> **Supersedes:** New sprint from `docs/superpowers/specs/2026-05-05-cockpit-surfaces-ux-design.md`. Architecture authority: `docs/architecture.md` §22.

**Duration:** 14 days, post-S13
**Status:** planned (post-MVP)
**Depends on:** S13 (Cockpit Shell) — KPI dashboard lives in the centre pane of the existing shell

## Scope summary

Ship the business KPI dashboard — three-pillar governance view (Business · Operational · Quality) with per-pilot breakdown, agent-level drill-down to individual Langfuse traces, and companion-generated business-impact insights. KPI materialization cron job for sub-500 ms dashboard loads.

## Deliverables

### Frontend

| Component | Description |
|---|---|
| `KPIDashboard.tsx` | Three-pillar layout with Tier 1/Tier 2/Tier 3 expand |
| `PillarCard.tsx` | Single pillar: icon + title + ≤5 KPIs + sparklines + "Per-pilot ▼" |
| `KPINumber.tsx` | Eased-tween number display with azur halo on update |
| `PerPilotTable.tsx` | Sortable per-pilot breakdown table, Tier 2 |
| `AgentLevelAnalysis.tsx` | Agent topology view (reused canvas) with per-node pass rate/latency/cost, Tier 3 |
| `AgentNodeInspector.tsx` | Click node → last 5 runs, eval scores, cost, "Ask companion →" |
| `BusinessImpactRow.tsx` | Companion-generated insights: cost avoidance, time saved, regulatory margin |

### Backend

| Route | Description |
|---|---|
| `GET /api/:country/kpis` | Aggregated three-pillar KPIs across all pilots |
| `GET /api/:country/kpis/:pilot_slug` | Per-pilot KPI breakdown |
| `GET /api/:country/kpis/:pilot_slug/agents` | Per-agent trace analysis (last 5 runs, eval scores, cost) |

### Infrastructure

| Component | Description |
|---|---|
| KPI snapshotter cron | Every 6h: materialize daily KPI snapshots for sparklines |
| KPI WebSocket channel | Broadcast `kpi_update` events on pilot state changes |
| Migration `0021` | `kpi_snapshots` table |

## Acceptance criteria (5 of 20)

- AC-08: Three pillars with ≤5 primary KPIs each; tabular-nums; sparklines from snapshots
- AC-09: Per-pilot breakdown expands sortable table; click navigates to pilot workspace
- AC-10: Agent-level drill-down shows per-node pass rate, latency, cost; last 5 runs on click
- AC-17: KPI dashboard loads ≤ 500 ms (materialized snapshots)
- AC-20: Cross-country data isolation enforced at DB level

## Linear issues (sibling)

| Issue | Title |
|---|---|
| LIN-10 | KPIDashboard + PillarCard + KPINumber components |
| LIN-11 | PerPilotTable + AgentLevelAnalysis + AgentNodeInspector |
| LIN-12 | BusinessImpactRow + companion KPI insight generation |
| LIN-13 | Gateway: KPI routes + aggregation logic |
| LIN-14 | KPI snapshotter cron + WebSocket channel |
| LIN-15 | Migration 0021: kpi_snapshots |
| LIN-16 | E2E: KPI AC Playwright tests |
