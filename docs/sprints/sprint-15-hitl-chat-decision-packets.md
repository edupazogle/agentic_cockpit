# Sprint 15 — HITL Chat + Decision Packets

> **Supersedes:** New sprint from `docs/superpowers/specs/2026-05-05-cockpit-surfaces-ux-design.md`. Architecture authority: `docs/architecture.md` §21.

**Duration:** 14 days, post-S14
**Status:** planned (post-MVP)
**Depends on:** S14 (KPI Dashboard) — HITL chat is the fourth surface, completing the cockpit

## Scope summary

Ship the full HITL chat experience: decision packets for gate firings, operator Approve/Override/Escalate workflow, citation chips with hover-expand, artifact cards, and the country-level companion thread. The chat becomes the educational and operational communication layer. External escalation adapter is architected but ships as no-op (S16 activates it).

## Deliverables

### Frontend

| Component | Description |
|---|---|
| `DecisionPacket.tsx` | Gate fire card: evidence packet, cost-if-wrong, SLA timer, Approve/Override/Escalate buttons |
| `CitationChip.tsx` | Inline superscript citation, hover-expands to 240 px card with source + snippet |
| `ArtifactCard.tsx` | Embedded card in companion messages: KPI mini, gate history, generated deck link |
| `ThinkingIndicator.tsx` | Three breathing dots + bot-message-square icon, 600 ms loop |
| `ChatMessage.tsx` | User / companion / system message types with correct alignment + styling |
| `ChatComposer.tsx` | Text input + attachment button + send, character count (≤180 char hint) |
| `SLATimer.tsx` | Countdown timer on decision packets, amber pulse when <60s remaining |

### Backend

| Route | Description |
|---|---|
| `POST /api/:country/chat/escalate` | Push decision packet to external tool (no-op at S15, adapter interface exercised via mock) |
| `GET /api/:country/chat/thread/messages` | Paginated message history |
| WebSocket `chat_update` | Real-time companion messages + decision packet delivery |

### Chat companion tools (country-level, additive to builder spec §2.5)

| Tool | Description |
|---|---|
| `list_country_pilots` | All pilots in this country with level + domain + status |
| `aggregate_kpis` | Business / Operational / Quality roll-up across all pilots |
| `compare_pilots` | Side-by-side KPI comparison for 2+ pilots |
| `search_blueprint_library` | Cross-country shared assets |
| `propose_pilot_template` | Suggest new pilot from blueprint library |

### Langfuse Prompts (new)

```
companion/country/kpis/v1         — KPI surface context overlay
companion/country/chat/v1         — chat surface context overlay
companion/country/decision/v1     — HITL decision packet generation
companion/tool/list_country_pilots/v1
companion/tool/aggregate_kpis/v1
companion/tool/compare_pilots/v1
companion/tool/search_blueprint_library/v1
companion/tool/propose_pilot_template/v1
```

## Acceptance criteria (5 of 20)

- AC-11: HITL decision packet appears in chat when gate fires; Approve/Override/Escalate work; every decision audit-logged
- AC-12: Companion never invents a citation; every citation chip hover-expands correctly
- AC-13: External escalation adapter exists as no-op; config + feature flag activates without code changes
- AC-14: Every animation respects `prefers-reduced-motion: reduce` → 0 ms
- AC-15: All copy in EN + FR; language switch doesn't break chat thread

## Linear issues (sibling)

| Issue | Title |
|---|---|
| LIN-17 | DecisionPacket + SLATimer + Approve/Override/Escalate workflow |
| LIN-18 | CitationChip + ArtifactCard + ThinkingIndicator |
| LIN-19 | ChatMessage + ChatComposer + message types |
| LIN-20 | Gateway: chat routes + country companion tools |
| LIN-21 | Langfuse: country companion chat/KPI/decision prompts |
| LIN-22 | External escalation adapter interface + mock implementation |
| LIN-23 | E2E: HITL chat AC Playwright tests |
