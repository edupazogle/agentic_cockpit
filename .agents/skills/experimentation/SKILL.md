---
name: experimentation
description: Run small, reproducible LLM/prompt/architecture experiments to back design decisions in docs/refactor_main_v3.md. USE WHEN a design choice is in doubt, a NIM/prompt assumption needs validating, or a refactor section needs evidence before locking. Each run produces a self-contained experiment folder, a §17 sprint record in the refactor doc, and a self-improvement entry on this skill.
argument-hint: "Driving question (e.g. 'does §15.2 plan prompt actually work on NIM 120B?', 'does the gateway scale to 50 concurrent runs?')"
---

# Experimentation Skill

Turn open design questions into reproducible evidence. The skill is opinionated about **structure**, not about what to test — use it for any prompt/model/architecture/integration experiment in this repo.

> **Outputs of every run, mandatory:**
> 1. A folder under `experiments/YYYY-MM-DD-<slug>/` with self-contained harness + raw outputs.
> 2. A new `## 17.N` sprint record appended to `docs/refactor_main_v3.md`.
> 3. A self-improvement entry appended to this skill's "Lessons learned" section if anything reusable was discovered.

---

## When to use this skill

- A `Q-decision` (§2 of refactor_main) is being challenged.
- A NIM model behavior, prompt structure, token budget, or latency claim needs proving.
- A new integration (Chatwoot, Langflow, n8n, OTel exporter) needs a smoke-test before §6 sprint commitment.
- A `bundle_lint` / scoring heuristic needs calibrating against real outputs.
- An open follow-up in §12 needs closing before the related sprint starts.

**Don't** use this skill for unit tests, CI checks, or reproducing already-known behavior. Those belong in the package's own test directory.

---

## The 5-step recipe

### Step 1 — Frame the question

A good experiment question:
- Has a binary or quantifiable success criterion.
- References the `refactor_main_v3.md` section it would change.
- Is small enough to run in <30 minutes wall-clock.

**Anti-pattern:** "Test if Langflow works." → Too vague.
**Good:** "Does §15.2's Plan-phase prompt produce 9-section plans on NIM 120B at `max_tokens=4096`, across 3 brief styles?"

If the question doesn't fit on one line, decompose it. Use `ask_user` to confirm scope before running anything that costs tokens. Skip the question only when in autopilot mode AND the request is unambiguous.

### Step 2 — Scaffold the experiment folder

```
experiments/YYYY-MM-DD-<short-slug>/
├── run.py            # primary harness (V1 — as currently spec'd)
├── run_v2.py         # optional fix variant (only if V1 fails)
├── findings.md       # working notes — superseded by §17 entry once locked
├── out/              # raw outputs from V1
│   ├── <cell>.md
│   ├── <cell>.json   # per-cell scoring
│   └── summary.json  # full run summary
└── out_v2/           # raw outputs from V2 (if present)
```

**Date format is `YYYY-MM-DD`.** Slug is kebab-case, ≤6 words.

### Step 3 — Write the harness

Conventions for every Python harness in this repo:

- Stdlib `urllib.request` only — no `httpx`/`requests` dep. Keeps the harness portable.
- Read keys from `os.environ`; expect the caller to source `.env.local` before running.
- Define a `BRIEFS` (or `INPUTS`, `CASES`, …) dict at the top — keys are short labels, values are the raw input.
- Define a `RX` dict of regex patterns used by `score()`. One `score(content) -> dict` function returning a scalar/boolean per criterion plus a single `*_pass` aggregate.
- Loop over input × condition; write per-cell `<cell>.md` and `<cell>.json`; write a final `summary.json` and a printed summary table.
- Latency, prompt/completion tokens, and any pass/fail booleans go into `summary.json`.
- Cap completion budget defensively. **For NIM `nvidia/nemotron-3-super-120b-a12b`: never below `max_tokens=6000` for plan-style outputs, `8000` for bundle-style outputs** (Lesson #1).

**Don't use the `openai` SDK** unless the test is specifically about SDK behavior. Raw HTTP keeps the experiment honest about what's on the wire.

A reusable harness skeleton lives at `experiments/2026-05-03-s14-s15-refinement/run_v2.py` — copy it as a starting point.

### Step 4 — Run, score, write findings

1. `set -a && . ./.env.local && set +a; cd experiments/<folder>; python3 run.py`
2. Inspect `summary.json` printed table. Confirm pass/fail.
3. If V1 fails, formulate a hypothesis and write `run_v2.py` testing exactly one variable. Don't change two things at once.
4. Write `findings.md` with: TL;DR (≤4 bullets), test setup, results tables, issues identified (severity-ranked), proposed fixes, open questions.

### Step 5 — Lock decisions in `docs/refactor_main_v3.md` §17

Append a new `## 17.N — YYYY-MM-DD-<slug> — <one-line title>` section immediately before `## Appendix A`. Use the §17.1 entry as a template — sections required:

1. **Folder + Author + Driving question** — header block.
2. **TL;DR** — ≤4 bullets.
3. **Test setup** — briefs/inputs, conditions, model, scoring, total token cost.
4. **Results** — tables (one per condition or generation).
5. **Issues identified** — severity-tagged (HIGH/MEDIUM/LOW), each with the proposed fix.
6. **Decisions made** — a table mapping each issue to a refactor section + status.
7. **Open questions surfaced** — bulleted; mirror them into §12.
8. **Reproduction** — exact bash commands.
9. **Artifacts** — relative links to harness + outputs.

Apply each fix as a real edit to the relevant `§N.M` section *in the same commit*. **An experiment is not done until the doc is updated** — that's the whole point.

### Step 6 — Self-improve this skill

Before closing the task, append a "Lesson" entry below if the run uncovered any reusable advice:

- A NIM/model quirk that future experiments will trip on.
- A prompt-structure rule that worked.
- A scoring/lint heuristic improvement.
- A token-budget number worth memorialising.

Format: one bullet, ≤2 sentences, dated. The skill compounds in value across runs.

---

## Lessons learned (append-only — newest at top)

### 2026-05-03 — `2026-05-03-s14-s15-refinement`

- **NIM `nvidia/nemotron-3-super-120b-a12b` thinking-mode toggle is broken.** `chat_template_kwargs.thinking=false` and `/no_think` system messages are both ignored on `integrate.api.nvidia.com/v1`. The model still emits 50–500 reasoning tokens. Always budget `max_tokens ≥ 6000` for plan-style outputs and `≥ 8000` for bundle-style outputs, otherwise the back of the document truncates. `reasoning_content` is in `choices[0].message.reasoning_content` — capture it separately, never replay it as content.
- **Long-context exemplar injection causes format-mimicry.** When you inject a multi-thousand-line exemplar and a separate target schema, the model imitates the exemplar's structure ~50% of the time. Fix: inject a ≤300-token *checklist* extracted from the exemplar, place the target schema **adjacent to the user's input at the end of the user message**, and reserve the exemplar for later phases (e.g., bundle generation, not plan generation).
- **Skills access (`.agents/skills/*`) materially helps grounding.** Including a curated skills pack (~16K tokens — `agentic-cockpit`, `chatwoot`, `otel`, `posthog`, `langfuse`, `supabase`, `railway`, plus the first ~200 lines of three n8n sub-skills) increases regulator-URL citations 50–200% and produces verbatim-correct repo-file references. Send as a single user-message block, not in the system prompt.
- **Literal-string scoring regexes are brittle.** "HMAC" the acronym, "request signing", "webhook signature", "shared secret signature", and `X-*-Signature` headers all describe the same pattern. Score for the *concept*, not the keyword.
- **Stdlib `urllib.request` is enough.** Six experiment cells × two generations + a 17K-token prompt all ran cleanly with stdlib HTTP and a 300s timeout. No need to add `httpx`/`requests` to the dep tree for one-shot experiments.

<!-- Append new lessons above this comment. Keep entries terse. -->

---

## Anti-patterns

| Don't | Why |
|---|---|
| Run an experiment without writing a §17 record | The whole point is to lock the decision in the canonical doc. |
| Change two prompt variables at once between V1 and V2 | You can't attribute the result. |
| Use `gpt-4`/`claude-*` as a "judge" without recording the judge prompt | Unreproducible. If you must use an LLM judge, save its prompt + version into the experiment folder. |
| Commit `out/` files larger than ~100KB each | Outputs are diff-readable; if they're huge, summarise into JSON and discard the verbose form. |
| Skip self-improvement of this skill | The skill compounds in value only if every run feeds back. |

---

## Quick-reference snippets

### Reading API key + calling NIM (stdlib only)

```python
import json, os, time, urllib.request

API_KEY = os.environ["NVIDIA_NIM"]
URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = "nvidia/nemotron-3-super-120b-a12b"

def chat(messages, max_tokens=6000, temperature=0.2):
    body = json.dumps({"model": MODEL, "messages": messages,
                       "max_tokens": max_tokens, "temperature": temperature}).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    return {"content": d["choices"][0]["message"].get("content") or "",
            "reasoning": d["choices"][0]["message"].get("reasoning_content") or "",
            "usage": d.get("usage", {}), "latency_s": round(time.time() - t0, 1)}
```

### Listing available NIM models

```bash
set -a && . ./.env.local && set +a
curl -sS https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer $NVIDIA_NIM" | jq -r '.data[].id' | grep nemotron
```

### Sourcing `.env.local` correctly

```bash
cd /home/mr_e/agentic
set -a && . ./.env.local && set +a
# now NVIDIA_NIM, SUPABASE_URL, etc. are exported
```
