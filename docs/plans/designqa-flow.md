# DesignQA Flow — End-to-End Plan

> Single source of truth for how a frontend change moves from `design` skill output
> → automated QA → human review → **Figma published as canonical artefact**.
> Figma is the final destination, not the starting point.

---

## 1. Goals

1. **Catch overlap, contrast, and a11y issues automatically** before the user is asked to look.
2. **Force Copilot (the agent) to be the critic**, not the author — viewimage + axe + machine reports drive verdicts.
3. **Component-state coverage** at the React level so every variant is screenshotted and regression-tested.
4. **Figma is the canonical published artefact** for delivered screens and components — auto-synced after QA passes.
5. **Linear is the work tracker** — frontend issues get auto-created/updated with figma + acceptance-criteria links.
6. **Architecture.md stays accurate** — QA failures that reveal architectural drift produce edits.

---

## 2. Tooling stack (decisions)

| Layer | Tool | Rationale |
|---|---|---|
| Browser automation | **Playwright** (already in `shoot.py`) | Multi-viewport, deterministic, scriptable |
| A11y | **axe-core via `axe-playwright-python`** | Catches contrast/role/label/aria — what viewimage cannot see |
| Visual regression (mockups) | **pixelmatch** in-house diff (Python) | Zero-cost, runs locally; compares vs `baselines/` |
| Component coverage (Sprint 1+) | **Storybook 8 + Chromatic** | Once `agentic-web/components/` exists; every story = visual test |
| Critic | **Copilot CLI viewimage** | Mandatory — agent must view every shot and write critique |
| Linear sync | **Linear MCP** (already configured) | Create/update issues, add Figma & acceptance criteria |
| Figma sync | **Figma MCP** (to install — see §6) + **figma-export agent skill** | Push frames + components to canonical file |
| Spec source | `docs/sprints/*.md` + `docs/architecture.md` | What the change must satisfy |

**Defer** Storybook/Chromatic until Sprint 1 lands React components. **Add** axe and pixelmatch now.

---

## 3. The flow (one round)

```
┌─────────────────────────────────────────────────────────────────────┐
│  design skill produces / changes a screen                           │
│  (mockup HTML or React component)                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  designqa skill — automated phase                                   │
│  ─────────────────────────────────────                              │
│  1. shoot.py captures all states (idle, hover, active, error,       │
│     viewport variants 1440 / 1024 / 375)                            │
│  2. axe.py runs axe-core, writes axe.json                           │
│  3. diff.py compares vs baselines/, writes diff.json                │
│  4. report.py builds report.md + report.json                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  designqa skill — agent critic phase                                │
│  ──────────────────────────────────                                 │
│  Copilot MUST:                                                      │
│   • viewimage every screenshot                                      │
│   • read sprint spec + architecture.md for the feature              │
│   • write critique (overlap, alignment, hierarchy, narrative fit)   │
│   • merge with axe + diff results into final verdict                │
│  Verdict: PASS  |  PASS-WITH-NOTES  |  FAIL                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
   FAIL / NOTES                                   PASS
        │                                             │
        ▼                                             ▼
┌───────────────────────┐               ┌─────────────────────────────┐
│ Loop back to design   │               │ designqa publish phase      │
│ skill with concrete   │               │ ─────────────────────────── │
│ fix list. No user     │               │ 1. figma-export pushes      │
│ ask until verdict ≠   │               │    frames + components to   │
│ FAIL.                 │               │    canonical Figma file     │
└───────────────────────┘               │ 2. linear-sync creates /    │
                                        │    updates frontend issue   │
                                        │    with Figma URL + AC      │
                                        │ 3. report.md committed to   │
                                        │    docs/designqa-reports/   │
                                        │ 4. architecture.md edited   │
                                        │    if drift was detected    │
                                        └─────────────────────────────┘
                                                      ▼
                                        ┌─────────────────────────────┐
                                        │ Hand back to user with:     │
                                        │ • report.md link            │
                                        │ • Figma frame URL           │
                                        │ • Linear issue URL          │
                                        │ • diff before/after gif     │
                                        └─────────────────────────────┘
```

---

## 4. Concrete deliverables — `.agents/skills/designqa/`

```
designqa/
├── SKILL.md                # Updated to enforce the flow above
├── tools/
│   ├── shoot.py            # ✅ exists — extend with viewport matrix + state matrix
│   ├── axe.py              # NEW — axe-core via axe-playwright-python
│   ├── diff.py             # NEW — pixelmatch wrapper, writes diff.json
│   ├── report.py           # NEW — assembles report.md + report.json
│   ├── figma_export.py     # NEW — pushes frames to Figma via MCP / REST
│   └── linear_sync.py      # NEW — creates/updates frontend issues
├── baselines/              # PNG baselines per (page, state, viewport)
└── reports/                # Last-run artefacts (gitignored)
```

### `shoot.py` extension
- Accept a **state matrix**: `{ idle, hover:#sel, focus:#sel, active:#sel, error, loading }`.
- Accept a **viewport matrix** default `[[1440,900],[1024,768],[375,812]]`.
- Output naming: `<page>--<state>--<vw>x<vh>.png`.

### `axe.py` (new)
- `axe.py <url> <out_json> [--include selector] [--exclude selector]`.
- Uses `Axe(page).run()` → JSON violations grouped by impact.
- Fails non-zero only on `serious`/`critical` (advisory: `moderate`/`minor`).

### `diff.py` (new)
- `diff.py <baseline_dir> <current_dir> <out_json>`.
- Per file: % pixels changed; threshold default 0.1 %.
- Writes side-by-side diff PNGs to `reports/diffs/`.

### `report.py` (new)
- Inputs: shots dir, axe.json, diff.json, sprint spec path, agent critique markdown.
- Output: `reports/<ts>/report.md` + `report.json`.
- Sections: Summary verdict · Screenshots gallery · A11y violations · Visual diffs · Agent critique · Acceptance-criteria checklist · Linear/Figma links.

### `figma_export.py` (new) — see §6
- Pushes named frames to a fixed Figma file (per page in Figma: one for screens, one for components, one for the scenario builder).
- Idempotent: replaces frames by name, preserves frame IDs so existing comments survive.
- Writes a `figma-manifest.json` mapping local screenshot → Figma frame URL.

### `linear_sync.py` (new)
- Idempotent issue upsert keyed by `frontend-feature-id` label.
- Posts/updates: Figma frame URL, acceptance criteria from sprint doc, screenshot links, a11y summary, blocking relations to backend issues.
- Reads architecture.md table-of-contents to pick correct sprint label.

---

## 5. SKILL.md rewrite — the **mandatory** Copilot loop

Replace the current §4b with a hard-gate procedure:

> **Before declaring any QA verdict you MUST**, in this exact order:
> 1. Run `shoot.py` for the page across all states + viewports.
> 2. Run `axe.py` for each viewport.
> 3. Run `diff.py` against baselines (or seed baselines on first run).
> 4. **Use `viewimage` on every produced PNG**. For each, write 3–6 lines:
>    overlap?, hierarchy fit?, contrast?, narrative fit per sprint spec?
> 5. Read the relevant sprint doc + architecture.md sections.
> 6. Reconcile findings into `report.md` with PASS / PASS-WITH-NOTES / FAIL.
> 7. **If FAIL: do not return to user.** Patch the design and re-run from step 1.
> 8. Only on PASS, run `figma_export.py` → `linear_sync.py` → return verdict.

Add the rule: **agent critique is mandatory and is the document of record**, not the screenshots alone.

---

## 6. Figma MCP + agent skills (currently missing)

### MCP install — add to `.vscode/mcp.json`

The Figma "Dev Mode MCP Server" (official, in Beta) ships inside the Figma desktop app and exposes `http://127.0.0.1:3845/mcp`. Steps:

1. **Enable** in Figma desktop → Preferences → "Enable Dev Mode MCP Server".
2. **Add to `.vscode/mcp.json`:**
   ```jsonc
   "figma": {
     "type": "http",
     "url": "http://127.0.0.1:3845/mcp"
   }
   ```
3. For headless/CI use, fall back to the **Figma REST API** with a personal access token (`FIGMA_TOKEN` in `.env.local`) — `figma_export.py` should support both transports.

### Agent skill — `.agents/skills/figma/SKILL.md` (NEW)

Single skill covering both authoring and publishing:

- **Triggers:** "push to Figma", "publish frames", "sync design", "figma export", "create figma component".
- **Conventions for this repo:**
  - Canonical file: `AXA Agentic Cockpit — Design System` (file key in env `FIGMA_FILE_KEY`).
  - Pages (delete and recreate clean per the user request):
    1. `01 · Cover` — index
    2. `02 · Cockpit Screens` — every page in `agentic-web/app`
    3. `03 · Scenario Builder` — builder.html states + dynamic flow
    4. `04 · Scenario Canvas` — canvas.html states (FIT, focus, HITL)
    5. `05 · Components` — node cards, hitl banner, run head, decision pane, inspector
    6. `06 · Tokens` — colors (AXA palette), spacing, typography, radii
    7. `07 · Animations` — recorded clips (mp4 frames) of energy flows, MCP toasts, HITL pulse
- **Commands:**
  - `figma push --page <name> --frames <list>` (uses MCP if available, REST otherwise)
  - `figma reset-pages` (deletes existing pages and recreates the structure above)
  - `figma diff` (compares current Figma frames vs `reports/diffs/`)
- **Component naming:** `Cockpit/<Component>/<Variant>`, e.g. `Cockpit/NodeCard/Running`.
- **Tokens:** generated from `app/globals.css` AXA variables → published as Figma variables.

### Why two artefacts (skill + MCP)

- The MCP exposes Figma to the agent at runtime (read frames, get nodes, comment).
- The skill is the *playbook*: the conventions, file key, page structure, naming rules — what the agent MUST follow when calling the MCP. Without the skill, the MCP becomes a foot-gun.

---

## 7. Linear integration — what the issues look like

For every frontend feature touched by `designqa`:

- **Parent issue** (existing backend Sprint X feature) — gets a *Blocked by* link to the new frontend issue.
- **New frontend issue** title: `Sprint X — Frontend — <feature>`.
- **Body sections** (auto-templated):
  1. Linked Figma page URL (deep link to the frame, not the file root).
  2. Acceptance criteria (copied from sprint doc, expanded with animation + a11y notes).
  3. Backend dependencies (API endpoints, state shape, RBAC) — copied from architecture.md.
  4. Screenshots (current + baseline + diff).
  5. axe summary.
- **Labels:** `frontend`, `sprint-N`, `figma-synced`, `designqa-pass`.

---

## 8. Sprint 1+ addition: Storybook + Chromatic

Once `agentic-web/components/*.tsx` exists:

1. `pnpm dlx storybook@latest init --type nextjs`.
2. Every component gets `<Component>.stories.tsx` covering: default, hover, focus, error, loading, empty, RTL.
3. Chromatic project token in repo secrets; CI workflow `.github/workflows/chromatic.yml` runs on PRs touching `agentic-web/`.
4. `designqa` learns to **invoke Chromatic via CLI** and parse the JSON result, treating Chromatic visual diffs as a first-class input alongside `diff.py`.
5. Storybook stories become the source for `figma_export.py` component frames — one Figma component per story.

This is the right time because:
- Stories give us deterministic component states (no flaky DOM screenshots).
- Chromatic does the diff infra better than our local `pixelmatch` wrapper.
- Figma component → Story → React component traceability becomes 1:1.

---

## 9. Phasing (track in SQL todos)

| Todo id | Title | Depends on |
|---|---|---|
| `dqa-axe` | Add `axe.py` + integrate into shoot flow | — |
| `dqa-diff` | Add `diff.py` + baseline directory convention | — |
| `dqa-report` | Add `report.py` producing `report.md` | dqa-axe, dqa-diff |
| `dqa-skill-rewrite` | Rewrite designqa SKILL.md with mandatory loop | dqa-report |
| `figma-mcp` | Add Figma MCP entry in `.vscode/mcp.json` + token in `.env.local` | — |
| `figma-skill` | Create `.agents/skills/figma/SKILL.md` with conventions | figma-mcp |
| `figma-reset` | Reset Figma file pages to canonical structure | figma-skill |
| `figma-export-tool` | Build `figma_export.py` (MCP + REST fallback) | figma-skill |
| `linear-sync-tool` | Build `linear_sync.py` issue upsert | dqa-report |
| `dqa-test-loop` | Run full loop on `codex/canvas.html` end-to-end | all above |
| `sprint1-storybook` | Bootstrap Storybook in `agentic-web/` | Sprint 1 components exist |
| `sprint1-chromatic` | Wire Chromatic in CI | sprint1-storybook |

---

## 10. Acceptance for this plan

Plan is "implemented" when:

1. `axe.py`, `diff.py`, `report.py`, `figma_export.py`, `linear_sync.py` exist and have a CLI smoke test.
2. `designqa` SKILL.md enforces the §5 hard-gate loop.
3. `figma` skill exists; Figma MCP is in `mcp.json`; canonical Figma file pages match §6.
4. One full round on `codex/canvas.html` produces:
   - `report.md` PASS,
   - a refreshed Figma frame, link returned,
   - a Linear frontend issue with Figma URL.
5. `architecture.md` references `docs/plans/designqa-flow.md` from §11 (Security Trust Model — observability annex) so future contributors find it.
