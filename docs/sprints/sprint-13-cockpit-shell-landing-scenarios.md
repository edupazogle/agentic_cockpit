# Sprint 13 — Cockpit Shell: Landing + Sphere + Scenarios

> **Supersedes:** This is a new sprint created from `docs/superpowers/specs/2026-05-05-cockpit-surfaces-ux-design.md`. Architecture authority: `docs/architecture.md` §21.

**Duration:** 14 days, post-S12
**Status:** planned (post-MVP)
**Depends on:** S12 (Companion Polish) — the country-level companion builds on the pilot-level companion

## Scope summary

Ship the cockpit shell (top bar, tab bar, country selector, ⌘K) and the first two surfaces: landing page with configurable bento and scenario view with pilot catalog. The sphere companion is the centerpiece — always visible, click-to-radiate, persistent across surfaces. Chat slide-over is functional but HITL decision packets arrive in S15.

## Deliverables

### Frontend

| Component | Description |
|---|---|
| `CockpitShell.tsx` | Top bar + tabs + sphere zone + centre pane layout |
| `TopBar.tsx` | Brand, tab segments, country selector, ⌘K trigger, settings gear |
| `TabBar.tsx` | Three-segment animated underline navigation |
| `CountrySelector.tsx` | Dropdown with country list + pilot count |
| `SphereCompanion.tsx` | 130×130 px sphere, breathing glow, click → radial menu |
| `RadialMenu.tsx` | 6-action fan-out with spring easing, staggered delays |
| `CompanionNudge.tsx` | Contextual suggestion text, 30s rotation |
| `ChatSlideOver.tsx` | 380 px slide-from-right panel with message list + composer |
| `CommandPalette.tsx` | ⌘K overlay with grouped results, arrow-key navigation |
| `LandingBento.tsx` | Configurable 12-col grid rendering bento modules |
| `modules/*.tsx` | KPIHeroStrip, ActivePilotsGrid, HITLQueueSnapshot, SavingsTracker, QualityGateCompletion, CompanionInsightCard, PilotHealthMap, ActivityFeed, BlueprintLibraryModule |
| `ScenarioGrid.tsx` | Responsive card grid (3/2/1 columns) |
| `ScenarioCard.tsx` | Tier 1 card + Tier 2 expand with live indicators |
| `ScenarioFilters.tsx` | Segmented level filter + search + sort dropdown |

### Backend

| Route | Description |
|---|---|
| `GET /api/countries` | List accessible countries |
| `GET /api/:country/landing` | Bento config + module data |
| `PUT /api/:country/landing/config` | Update bento layout |
| `GET /api/:country/scenarios` | Pilot catalog (filter: level, domain, status, search) |
| `GET /api/:country/chat/thread` | Get or create country-level chat thread |
| `POST /api/:country/chat/messages` | User → companion (SSE stream) |

### Database

| Migration | Purpose |
|---|---|
| `0017_countries.sql` | countries table |
| `0018_country_users.sql` | user ↔ country access |
| `0019_blueprints.sql` | blueprint_assets + blueprint_imports |
| `0020_chat_threads_country.sql` | country-level chat threads |

## Acceptance criteria (12 of 20 from spec)

- AC-01: Country operator sees their country's landing page with configured bento
- AC-02: Country switching reloads all data; sphere blinks; chat thread switches
- AC-03: Sphere visible on all surfaces; radial menu shows correct contextual actions
- AC-04: Chat slide-over opens from sphere; thread persists across surface switches
- AC-05: Companion nudge changes within 30s and on surface switch
- AC-06: Landing bento reconfigurable via drag-and-drop; persists and renders correctly
- AC-07: Scenario view shows all pilots for country, filterable by level; live pilots have animated borders
- AC-16: FCP ≤ 1.5 s on throttled connection for landing page
- AC-19: Every Tier 1 card has Lucide icon with aria-label

## Companion prompt overlays (Langfuse Prompts — new)

```
companion/country/charter/v1      — country-level companion persona
companion/country/landing/v1      — landing surface context overlay
companion/country/scenarios/v1    — scenarios surface context overlay
companion/country/nudge/v1        — nudge generation (30s rotation)
```

## Dependencies

- **S12:** Companion polish — country companion builds on pilot companion's charter + tool surface
- **Design system:** Inherits builder spec §6 (motion tokens, progressive disclosure, density rules) unchanged
- **Codex CSS:** Existing `codex.css` token system + components extended with sphere, tab bar, KPI, chat styles

## Risks

| Risk | Mitigation |
|---|---|
| Sphere video rendering performance on low-end machines | Pure-CSS gradient fallback defined in spec; feature-flag for video vs. CSS |
| Bento configurability leads to fragmented UX | Opinionated default bento per country; companion-aided setup |
| Country-level chat thread context grows unbounded | Same compaction model as per-pilot threads (§2.3 builder spec) |

## Linear issues (sibling)

| Issue | Title | AC count |
|---|---|---|
| LIN-1 | CockpitShell + TopBar + TabBar + CountrySelector | 3 |
| LIN-2 | SphereCompanion + RadialMenu + CompanionNudge | 3 |
| LIN-3 | ChatSlideOver + ChatMessage + ChatComposer | 3 |
| LIN-4 | LandingBento + 10 bento modules | 3 |
| LIN-5 | ScenarioGrid + ScenarioCard + ScenarioFilters | 3 |
| LIN-6 | Gateway: cockpit routes + country resolution | 3 |
| LIN-7 | Supabase: migrations 0017–0020 | 1 |
| LIN-8 | Langfuse: country companion prompts | 1 |
| LIN-9 | E2E: 9 AC Playwright tests | 1 |
