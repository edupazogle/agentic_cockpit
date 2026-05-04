---
name: designqa
description: "Closed-loop frontend design QA. Renders the page with headless Chromium (Playwright), opens the PNG with the Copilot CLI `view` tool so the agent itself sees pixels, critiques against a strict zone+token contract from the `design` skill, applies fixes, re-screenshots, and only emits a pass once the rendered image matches the contract. USE WHEN: a design surface is claimed 'done', overlapping/regressing UI is suspected, or a Sprint surface is up for review."
---

# DesignQA — closed-loop visual QA

> **Pixels, not promises.** Every claim of "ready" must be backed by a screenshot the agent (Copilot CLI itself, not a sub-agent) has *actually viewed*. If you cannot screenshot or cannot view, you cannot pass — and you say so out loud in the report.

The mistake this skill exists to prevent: writing CSS, declaring "Phase 1 complete", and asking the human to look. That's how you ship overlapping panels.

---

## 0. The loop

```
┌───────────────┐   ┌──────────────────┐   ┌───────────────────────┐   ┌──────────────────┐
│ 1. screenshot │ → │ 2. view PNG      │ → │ 3. critique vs design │ → │ 4. fix or pass   │
│   (playwright)│   │   (built-in view)│   │   contract (zones,    │   │  if revise → loop│
│               │   │   returns pixels │   │   tokens, motion)     │   │                  │
└───────────────┘   └──────────────────┘   └───────────────────────┘   └──────────────────┘
                                  ↑                                              │
                                  └──────────── repeat until 'pass' ─────────────┘
```

Each iteration writes a numbered screenshot to `/tmp/designqa-<DATE>/<slug>--iter-NN.png` and a critique line to `docs/qa/<DATE>--<slug>.md`. **The loop is the deliverable.**

---

## 1. Tools — what's required vs. what's nice

| Tool | Required? | How to test |
|---|---|---|
| Python `playwright` + chromium | **required** | `python3 -c "from playwright.sync_api import sync_playwright; print('ok')"` and `ls ~/.cache/ms-playwright/chromium-*` |
| Copilot CLI `view` tool on PNG paths | **required** | call `view` with any `.png` path — output `<output_image>` block confirms image bytes returned |
| Local dev server | **required** | `curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:4173/<route>` |
| Linear MCP / `LINEAR_API_KEY` | optional | for §6 cross-check; if absent, write payload markdown |
| Figma MCP / `FIGMA_TOKEN` | optional | for §5 rebuild; if absent, write payload markdown |

If `playwright` or `view` are missing, **stop the pipeline** and surface "tooling gap" in the report. Do not bluff a critique.

---

## 2. Screenshot — `tools/shoot.py`

```bash
python3 .agents/skills/designqa/tools/shoot.py <url> <out.png> [w=1440] [h=900] [wait_ms=800]
```

The helper renders at the given viewport, waits for `networkidle` + a settle delay (so animations finish their entry), and writes a PNG. It does **not** do `full_page` by default — viewport-only catches z-order conflicts that full-page hides.

Capture three viewports per surface: `1440x900`, `1024x768`, `768x1024`.

---

## 3. View the PNG — closing the loop

Immediately after each screenshot, call the built-in `view` tool with the PNG path. The model will receive image bytes. **This is the only step that grants permission to write a critique.** No other source counts — not file size, not `pngcheck`, not your imagination.

```
view  path: /tmp/designqa-2026-05-04/canvas--iter-01.png
```

If the call returns text-only or errors: stop, report tooling gap, do not pass.

---

## 4. Critique — measured against the design contract

Open `.agents/skills/design/SKILL.md` and apply its **Layout Zone Contract** (§3.x of the design skill). The default cockpit zones are:

| Zone | Position | Min/max |
|---|---|---|
| `topbar`        | `top:0; left:0; right:0; height:64px` | sticky |
| `runhead-c`     | `top:24px; left:24px; right: <inspector-width + 32>` | min-height 92, max 120 |
| `toolbar-c`     | inline inside `runhead-c` (right cluster) — **never** as a separate floating pill | — |
| `pan-c`         | `top: <runhead bottom + 24>; left:24; right: <inspector-width + 32>; bottom: <activity-collapsed + 24>` | scrollable |
| `inspector-c`   | `top:24; right:24; bottom:24; width:460` | self-scroll |
| `activity-c`    | `left:24; right: <inspector-width + 32>; bottom:24; collapsed=56, open=280` | self-scroll |
| `hitl-banner`   | `left:24; bottom: <activity-collapsed + 16>; width: 540` | only when SIM in `wait` |
| `zoombar-c`/`minimap-c` | inside `pan-c` overlay, `right: <inspector-width + 32>` | bottom-right cluster |

Any element outside its zone is a **block**. Any two elements whose bounding boxes intersect that aren't a documented overlay (banner-over-canvas is OK; rail-over-rail is not) is a **block**.

Then for each captured screenshot write a critique under these exact headings:

```markdown
### <slug> · <viewport> · iter NN
- **First impression** — one sentence written *after* viewing the image.
- **Zone integrity** — list any element whose bounding box exceeds its zone or collides with another zone. None? say "clean".
- **Hierarchy** — does the headline lead? eyebrow + serif rhythm intact?
- **Tokens** — only AXA Canopée tokens? rogue palette?
- **Typography** — serif/mono pairing right? weights ≤ 3?
- **Spacing** — 4/8/12/24/40/64 grid honoured?
- **Motion (if applicable)** — animations behave? reduced-motion respected?
- **Hit targets** — interactive elements ≥ 40px?
- **Verdict** — `pass` / `revise` / `block`.
- **Concrete fixes** — bulleted, file:line where known.
```

If verdict is `revise` or `block` → fix → re-shoot → re-view → re-critique. **Same iteration number is a bug.** New iteration each pass.

---

## 4b. Content audit — must run *after* zone audit, *before* verdict

Zone integrity validates the picture frame. **Content integrity validates the picture itself.** Without this checklist the loop will pass a layout that has half the canvas missing, no edges drawn, or a banner amputating the only live node.

> ### Infinite canvas — read this first
>
> Some surfaces (canvas-style flow editors like `codex/canvas.html`, `studio/canvas.html`) are **deliberately wider than the viewport**. Cards extend horizontally beyond the right edge and the user pans/zooms to see them. **Do not** fail an infinite-canvas surface for "missing nodes" or "huge blank area" until you have done one of:
>
> 1. Captured a `--fit.png` frame after clicking the **Fit** button (or calling `window.CodexCanvas.fit()`) — this zooms out until all nodes fit. Run the node-count check on this frame.
> 2. Captured `--pan-1.png`, `--pan-2.png`, `--pan-3.png` frames at scripted scroll/pan offsets that together cover the full content extent.
>
> Surfaces marked **infinite-canvas: true** in their spec note are exempt from "all nodes visible at default zoom" — instead the canon is "all nodes visible at fit-zoom OR across pan tiles".

For every screenshot, before issuing a verdict:

| Check | How to verify | Fails if |
|---|---|---|
| **Canonical node count** | count nodes in spec'd canon image (default zoom for fixed surfaces, `--fit` frame for infinite-canvas surfaces) | spec'd node missing from the canon image |
| **Edges rendered** | every adjacent pair has a visible stroke between them in the canon image | any gap between two consecutive nodes has no connector |
| **Overlay anchors** | banner / minimap / toast / tooltip don't sit on the *current active* node | banner amputates a label or icon of the running/waiting node |
| **Empty regions** | for fixed surfaces, content occupies ≥ 60% of its box; for infinite-canvas surfaces, the visible window at default zoom shows ≥ 2 cards + connecting edges | fixed surface has dead zone; infinite-canvas window is empty at start |
| **Inspector opacity** | inspector fills its box with an opaque surface — no canvas bleed-through | text on the rail reads against canvas grid |
| **Node iconography** | nodes use semantic icons, not literal `i.` `ii.` `iii.` placeholders | enumeration leakage |
| **Interactive proof** | every button claimed in the spec has a `data-action` and a working handler | clicking does nothing, or no DOM/state change |
| **Inspector ↔ runhead gutter** | ≥ 32px breathing space between runhead's right cluster and inspector's left edge | actions cluster touches inspector edge |

Capture the audit as a sub-block under each iteration:

```markdown
- **Content audit**
  - surface: infinite-canvas | canon frame: --fit
  - nodes visible (fit): 8/8 ✓ | edges (fit): 7/7 ✓ | overlay-anchor: clean | window-at-default: 3 cards + 2 edges ✓ | opacity: ✓ | icons: ✓ | interactivity: Approve→state change ✓
```

**Hard rule:** never verdict `pass` while `nodes visible at canon zoom` < spec, or any of `edges / opacity / interactivity` fails. **For infinite-canvas, the canon is the `--fit` frame, NOT the default-zoom frame.**

---

## 4c. Interaction sweep — capture the *flow*, not just the resting state

A static screenshot of the home state lies about UX. Capture:

| Frame | Trigger | Filename suffix |
|---|---|---|
| `idle` | page just loaded, SIM at start | `--idle.png` |
| `play-tick-1..N` | after `Play` clicked, every 800ms tick | `--tick-NN.png` |
| `mcp-call` | the moment an agent fires an MCP (capture during the 480ms pulse) | `--mcp-<tool>.png` |
| `hitl-pause` | SIM enters `wait`, banner+siren visible, edges paused | `--hitl-pause.png` |
| `hitl-approve-before` | hover state on Approve button | `--approve-hover.png` |
| `hitl-approve-after` | 200ms after Approve clicked, state transition visible | `--approve-after.png` |
| `node-click` | inspector populated for clicked node | `--inspector-<node>.png` |
| `complete` | SIM at terminal state | `--complete.png` |

Use `tools/shoot.py` with the `--script` argument (added in this revision) to drive Playwright to click → wait → screenshot. If the script flag is absent, fall back to a Playwright Python snippet inline in the bash command.

---

## 4d. Mandatory hard-gate loop — full pipeline

**Before declaring any QA verdict you MUST run these steps in this exact order.** Skipping any step is a §8 anti-pattern.

```
Step 1 → shoot.py    capture all states × viewports
Step 2 → axe.py      a11y audit per viewport
Step 3 → diff.py     visual regression vs baselines (seeds on first run)
Step 4 → viewimage   view EVERY PNG the agent produced — no imagining
Step 5 → critique    write per-screenshot critique under docs/qa/<DATE>--<slug>.md
Step 6 → report.py   assemble report.md + report.json
Step 7 → if FAIL: fix → re-run from step 1 (do NOT return to user)
Step 8 → if PASS: figma_export.py → linear_sync.py → return verdict
```

### Copy-paste pipeline

```bash
DATE=$(date +%F)
SLUG=canvas
URL=http://localhost:4173/design-proposal/codex/canvas.html
SHOTS=/tmp/designqa-$DATE/$SLUG
SKILL=.agents/skills/designqa/tools

mkdir -p "$SHOTS" docs/designqa-reports docs/qa

# Step 1 — shoot all viewports
python3 $SKILL/shoot.py "$URL" "$SHOTS/$SLUG--idle--1440.png" 1440 900
python3 $SKILL/shoot.py "$URL" "$SHOTS/$SLUG--idle--1024.png" 1024 768
python3 $SKILL/shoot.py "$URL" "$SHOTS/$SLUG--idle--375.png"  375 812

# Step 2 — axe a11y audit
python3 $SKILL/axe.py "$URL" "$SHOTS/axe.json"

# Step 3 — visual diff vs baselines
python3 $SKILL/diff.py .agents/skills/designqa/baselines/$SLUG "$SHOTS" "$SHOTS/diff.json"

# Step 4 — viewimage (agent must call view tool on each PNG, see §3)
# Step 5 — write critique to docs/qa/$DATE--$SLUG.md

# Step 6 — assemble report
python3 $SKILL/report.py \
  --shots-dir "$SHOTS" \
  --axe-json  "$SHOTS/axe.json" \
  --diff-json "$SHOTS/diff.json" \
  --critique  "docs/qa/$DATE--$SLUG.md" \
  --surface   "$SLUG" \
  --out-dir   docs/designqa-reports

# Step 7 — on FAIL: fix and re-run from step 1

# Step 8 — on PASS: export to Figma + Linear
python3 $SKILL/figma_export.py \
  --page "02 · Cockpit Screens" \
  --frames idle hitl-pause complete \
  --shots-dir "$SHOTS"

python3 $SKILL/linear_sync.py \
  --surface "$SLUG" \
  --sprint 1 \
  --verdict PASS \
  --report-md "docs/designqa-reports/$DATE--$SLUG/report.md"
```

**Tool availability check** (run once per session):

```bash
python3 -c "from playwright.sync_api import sync_playwright; print('playwright ok')"
python3 -c "from PIL import Image; import numpy; print('Pillow+numpy ok')"
ls ~/.cache/ms-playwright/chromium-* 2>/dev/null | head -1 && echo "chromium ok"
```

If any check fails → surface as tooling gap in report and stop. Do not bluff a critique.

---

## 5. Figma rebuild

The reference Figma file is `https://www.figma.com/design/b4kOiuhQS8A4TniozYG8pH/AXA-Agentic-Cockpit-Design-Proposal`. Two-page contract:

1. `AXA Agentic Cockpit` — landing, scenario list, scenario detail, HITL queue, ops, audit, settings.
2. `Scenario Builder` — Compose, Connect, Lint, Preview, Deploy.

Figma REST cannot delete pages. If `FIGMA_TOKEN` is set, the skill emits a *plugin payload* (`docs/qa/<DATE>--figma-rebuild-payload.json`) and a manual checklist. If absent, payload only.

---

## 6. Linear cross-check

For every gap surfaced in §4 (verdict `revise`/`block`):

1. Search Linear for matching `Sprint X · Frontend · <slug>` or related issue.
2. If found in **In Progress / In Review** → add a `blocks` relation to it from a new tracking issue this report opens.
3. If found in **Backlog/Todo** → create a child issue `Sprint X · Frontend · <feature>` with body shaped as §6.1 below, link as parent's child.
4. If absent → same as (3) plus tag `frontend, designqa, sprint-X`.

If no Linear MCP nor `LINEAR_API_KEY` available: write `docs/qa/<DATE>--linear-payload/<issue-slug>.md` files for the human runner.

### 6.1 Issue body

```markdown
## Context
<from architecture.md and the relevant sprint doc>

## Acceptance criteria (frontend)
- [ ] <bullet from design contract>
- [ ] <bullet>

## Backend touch points
<gateway endpoints, MCP tools, SSE events the surface reads>

## Figma
<link to the page in the Cockpit Design Proposal file>

## QA evidence
- iter-NN screenshot: <path>
- critique: <docs/qa/...>
```

---

## 7. Final report — `docs/qa/<DATE>--<surface>.md`

Required sections:

1. **Surfaces reviewed** — list of URL × viewport × iter pairs with verdict
2. **Tooling gaps** — anything missing in §1 inventory
3. **Critiques** — every iteration body
4. **Diff applied** — `git diff --stat` between first and last iter
5. **Linear actions** — created / blocked / payload
6. **Figma actions** — applied / payload
7. **Pass/Block ledger** — checklist of every zone + token claim with `[x] verified at iter NN`
8. **Sign-off** — `green` only if every surface latest-iter verdict is `pass`

---

## 8. Anti-patterns that will get this skill bypassed

- ❌ "I'm reasonably sure the layout is fine" → bluff. Block.
- ❌ Viewing only one viewport → not enough; cockpit must work at 1024 too.
- ❌ Skipping iter-NN numbering → makes loop history un-auditable.
- ❌ Fixing CSS without a re-screenshot → didn't close the loop.
- ❌ Asking the user to "have a look" before iter-NN verdict is `pass` → forbidden.

---

## 9. Quick-start command (copy-paste)

```bash
DATE=$(date +%F); SLUG=canvas; URL=http://localhost:4173/design-proposal/codex/canvas.html
mkdir -p /tmp/designqa-$DATE docs/qa

# Tooling check first
python3 -c "from playwright.sync_api import sync_playwright; print('playwright ok')"
python3 -c "from PIL import Image; import numpy; print('Pillow+numpy ok')"

# Step 1: shoot idle state at 1440
python3 .agents/skills/designqa/tools/shoot.py "$URL" "/tmp/designqa-$DATE/$SLUG--idle--1440.png" 1440 900

# Then: view the PNG (§3), write critique to docs/qa/$DATE--$SLUG.md, run axe.py + diff.py, then report.py.
# See §4d for the full pipeline with all copy-paste commands.
```

Full pipeline is in **§4d** above.

---

*Companion skill: `design` (`.agents/skills/design/SKILL.md`) — owns the visual contract this skill validates against.*
*Tools: `shoot.py` (screenshots), `axe.py` (a11y), `diff.py` (regression), `report.py` (assembly), `figma_export.py` (Figma), `linear_sync.py` (Linear).*
