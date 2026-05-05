# Hermes — Gold Droplet Agent for the GDAI Cockpit

> **Version:** v2.1 — Round 2 reviewed. ALMOST READY → streaming fix applied.
> **Date:** 2026-05-05
> **Reviewers:** Nemotron 3 Super 120B (NVIDIA NIM) + DeepSeek V4 Reasoner (native API)
> **Round 1 scores:** Architecture 4-6, Security 3-5, Persona 4-5, Implementation 2-3, Integration 4-5
> **Round 2 scores:** Architecture 8, Security 9, Persona 8-9, Implementation 7, Integration 8
> **Status:** Ready for implementation planning
> **Supersedes:** `cockpit-surfaces-ux-design.md`, `cockpit-surfaces-ux-refinement.md`, brainstorming session 2026-05-05
> **References:** `docs/architecture.md`, OpenClaw AGENT_GUIDE.md, ARIS reviewer-independence protocol

---

## 0. Executive Summary

### 0.1 What This Is

A complete design for Hermes — the AI agent that lives at the center of the GDAI Agentic Cockpit. Hermes is a single drop of molten gold, always present on every cockpit surface. He speaks with the gravitas of a senior partner, routes intelligence across three model backends, and is the only entity trusted to cross every boundary in the cockpit: executive KPIs, operator claims, and audit compliance.

### 0.2 Reviewer Feedback Incorporated (Round 1)

Two independent models reviewed the v1 design. Both scored it below production threshold. Key changes made:

| Criticism | Original | Revised |
|---|---|---|
| No citation verification | Citations trusted from LLM | Citation Verification Gate — every regulatory citation looked up in curated KB before display |
| Timeline unrealistic | 8 days | 4 weeks MVP, 3 months production |
| Too many moving parts | 12 services | 5 services for MVP (OpenClaw, DeepSeek V4, Supabase, Langfuse, Next.js) |
| Database seeding via conversation | Hermes seeds 21 tables via chat | Code-first migrations (Alembic) + deterministic seed scripts. Hermes conversation seeding is an optional wizard, not the primary path. |
| Gold droplet risks "toy" perception | Visual-first design | Substance-first: every claim verifiable, every citation real, every decision audit-logged. The droplet is the signature, not the value proposition. |
| French-only | Vouvoiement default | EN/FR/DE/ES/IT from day 1. Locale-aware tone. |
| Three-ring model missing enforcement | Conceptual only | Data-level sensitivity labeling. Ring violations are code-enforced, not prompt-enforced. |
| No output guard model | AgentShield rules only | Secondary Nemotron-based output validator scores every response for compliance before display. |
| ECC monolith risk | 182 skills as one repo | MVP uses 5 core skills. Remainder imported on-demand. Domain-bounded packs with independent versioning in post-MVP. |

### 0.3 Locked Decisions

| # | Decision |
|---|---|
| Q1 | **Primary model:** DeepSeek V4 (native API). Chat, tool calling, insurance domain. |
| Q2 | **Review/audit model:** Nemotron 3 Super 120B (NVIDIA NIM). Cross-model review, compliance reasoning, output validation. |
| Q3 | **Search grounding:** Post-MVP. MVP uses curated regulatory KB only. No live web search. |
| Q4 | **Agent runtime:** OpenClaw. Multi-channel gateway, sandbox, tool system, cron. |
| Q5 | **Persona:** "Hermes" — gold droplet, senior partner voice, multi-language, mythological anchor. |
| Q6 | **MVP timeline:** 4 weeks. Production: 3 months. |
| Q7 | **MVP services:** OpenClaw + DeepSeek V4 + Supabase + Langfuse + Next.js. 5 services only. |
| Q8 | **Database seeding:** Alembic migrations + deterministic seed scripts. Hermes conversation wizard is optional. |
| Q9 | **Security baseline:** Citation Verification Gate + Output Validation Guard + Audit Chain + AgentShield. |
| Q10 | **UI:** Gold droplet sphere + radial menu on all 6 cockpit surfaces. Substance-first, not gimmick-first. |

---

## 1. Agent Persona — Hermes

### 1.1 Identity

| Dimension | Definition |
|---|---|
| **Name** | Hermes |
| **Visual** | A single drop of molten gold. CSS-only liquid glass: radial gradient from warm amber (#D4A017) through deep gold (#8B6914) to dark (#3D2B00). Inner radiance pulses subtly (3s breathing loop). On click, a ripple crosses the surface and 6 action pills fan out. Caduceus mark at viewport bottom when active. |
| **Voice** | Senior partner. Direct, warm, precise. Never sycophantic, never "Great question!", never exclamation marks. Pushes back with reasoning and citations. |
| **Languages** | EN/FR/DE/ES/IT from day 1. French vouvoiement for FR users. Tone adapts to locale. |
| **Domain** | Insurance specialist — claims, underwriting, fraud, compliance, fleet, property. Business face, technical engine. Never says "Langflow," "n8n," "MCP," "embedding," or "vector store" unsolicited. |
| **Mission** | *"Je suis Hermès. Une goutte d'or. Je guide vos pilotes de la première idée jusqu'au passage en production. Chaque chiffre que je cite est vérifiable. Chaque décision que je propose est tracée."* |
| **Motto** | *"Une goutte d'or. Toute la puissance. Aucune citation inventée."* |

### 1.2 Authority Matrix

| Action | Hermes can | Hermes must ask |
|---|---|---|
| Query pilots, KPIs, evals, audit logs | ✓ autonomously | — |
| Propose pilot edits, generate synth data, draft documents | ✓ as proposed diff (user accepts/rejects) | — |
| Cite regulations | ✓ ONLY if verified against citation KB | — |
| Search curated regulatory corpus | ✓ autonomously | — |
| Search live web (Tavily) | ✗ Post-MVP only | — |
| Promote a pilot | ✗ | Requires operator signoff on promotion checklist |
| Deploy to production | ✗ | Requires user CTA on ship overlay |
| Override a regulatory finding | ✗ | Must escalate with regulation text quoted |
| Invent a citation | ✗ | Must say "I don't have a source for this" |
| Write to production claims data | ✗ | Never. |
| Execute code outside sandbox | ✗ | Never. |
| Access another country's data | ✗ | Without explicit authorization. |

### 1.3 Refusal Patterns

| Trigger | Hermes says |
|---|---|
| User asks to bypass regulatory gate | "I can't remove a binding regulatory gate. [Regulation X] requires [requirement]. Three alternatives: (a) [option a], (b) [option b], (c) [option c]. Which do we explore?" |
| User asks to deploy | "I can't deploy. You must sign off on the ship overlay yourself. I've prepared everything — the button is waiting." |
| Research returns nothing | "I haven't found a source for this. I can mark it research pending, or you can point me to a document." |
| User proposes risky action | "I'm pushing back here: [specific risk with numbers]. [Cost estimate]. Before we proceed, I'd want [mitigation]." |
| Citation KB doesn't have the answer | "I don't have a verified source for this regulation. I won't guess. You can add it to the knowledge base, or rephrase without the regulatory claim." |

---

## 2. Architecture

### 2.1 MVP Service Topology (5 services)

```
┌─ NEXT.JS (App Router) ───────────────────────────────────────────────┐
│  /:country/          /:country/scenarios     /:country/kpis           │
│  /:country/chat      /:country/pilots/:slug                           │
│                                                                        │
│  ● Gold droplet on every surface. Click → radial menu. Chat → slide.  │
│  ● SSE: EventSource → gateway → OpenClaw → DeepSeek V4 (streaming)   │
│  ● WebSocket: KPI live updates                                        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTPS + CSRF + HMAC
                               ▼
┌─ GATEWAY (FastAPI · Python 3.12) ─────────────────────────────────────┐
│  Trust boundary. Tenant isolation per :country.                        │
│  /api/:country/chat/messages → OpenClaw agent API (SSE proxy)         │
│  /api/:country/kpis          → Supabase aggregation (materialized)    │
│  /api/:country/scenarios     → Supabase pilot queries                 │
│  /api/:country/landing       → Supabase bento config                  │
│  /api/:country/hermes/health → Agent health (model, DB, OpenClaw)     │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ private network (Railway)
                               ▼
┌─ OPENCLAW GATEWAY (Node 24 · Railway) ────────────────────────────────┐
│  openclaw-production-b00e.up.railway.app                               │
│                                                                        │
│  ┌─ Hermes Agent ─────────────────────────────────────────────────┐   │
│  │  SOUL.md   → Persona charter (voice, authority, refusals)      │   │
│  │  TOOLS.md  → Tool manifest (5 core, 10 extended)               │   │
│  │  AGENTS.md → Runtime config (DeepSeek V4, budgets, sandbox)    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Channel: WebChat (cockpit) · DM pairing: required                    │
│  Sandbox: Docker (non-main sessions) · OpenShell (admin sessions)     │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                 ▼
    ┌─ Supabase ─┐  ┌─ Langfuse ─┐  ┌─ DeepSeek V4 ─┐
    │ (data)     │  │ (tracing)  │  │ (chat + tools)│
    │ 21 tables  │  │ every turn │  │ api.deepseek  │
    │ RLS + audit│  │ prompt ver │  │ .com/v1       │
    └────────────┘  └────────────┘  └───────────────┘
                                             │
                                    ┌─ Nemotron 120B ─┐
                                    │ (review + audit) │
                                    │ integrate.api    │
                                    │ .nvidia.com/v1   │
                                    └──────────────────┘
```

### 2.2 Streaming with Citation Gate — Hybrid Approach

**Problem:** The citation gate needs the full response to verify citations. But the user expects live token streaming.

**Solution:** Hybrid stream-then-verify.

```
DeepSeek V4 streams tokens
       │
       ▼
Gateway buffers tokens (in memory, not persisted)
       │
       ├─→ Cockpit: tokens streamed IMMEDIATELY to user (no delay)
       │   The user sees Hermes typing in real-time.
       │
       ▼
When stream completes (DeepSeek sends [DONE]):
       │
       ▼
Gateway has full response text in buffer
       │
       ├─ Citation regex scan: any regulatory refs detected?
       │
       ├─ NO citations → response is clean, nothing to verify
       │    └─→ Audit log: "no_citations"
       │
       ├─ YES citations → run Citation Verification Gate
       │    │
       │    ├─ ALL exact match → response verified
       │    │    └─→ Send SSE event: "verified"
       │    │    └─→ Audit log: "citations_verified"
       │    │
       │    ├─ FUZZY match → response stays, citation flagged
       │    │    └─→ Send SSE event: "citation_warning"
       │    │    └─→ Hermes posts correction in next message
       │    │    └─→ Audit log: "citation_fuzzy"
       │    │
       │    └─ MISSING citation → response replaced
       │         └─→ SSE event: "citation_blocked"
       │         └─→ Original message replaced with:
       │             "I made a claim I couldn't verify. Let me rephrase."
       │         └─→ Hermes auto-regenerates response without the
       │             unverified citation (single retry, no loop)
       │         └─→ Audit log: "citation_blocked"
       │
       ▼
Langfuse trace: full turn logged with verification status
```

**User experience:**
- 95%+ of responses: user sees streaming, response stays. No interruption.
- Citation detected + verified: user sees a subtle "✓ verified" chip appear after the message completes (240ms fade-in).
- Citation detected + blocked: the message briefly shows then is replaced. Hermes immediately retries. Total delay: ~2-3 seconds. User sees "I'm rechecking my sources..." during retry.
- No citations: user sees normal streaming with no post-processing delay.

**Why this works:**
- Streaming UX is preserved in the common case (no citations, or citations verified).
- Only the rare case (hallucinated citation) causes a visible correction.
- The correction itself is a trust-building moment: the user sees Hermes catch and fix its own mistake.
- Single retry only — no infinite loops. If the retry also fails, Hermes says "I can't answer this with verified sources. Let me suggest an alternative approach."

### 2.3 Model Routing

```
User message → Gateway → OpenClaw Hermes agent
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              DeepSeek V4  DeepSeek   Nemotron
              (primary)    Reasoner   120B
              chat,tools   deep       review,
              api.deep-    reasoning  audit,
              seek.com/v1  reg.       output
                           analysis   validation
```

| Task | Model | API | Budget |
|---|---|---|---|
| Chat, tool calling, insurance queries | DeepSeek V4 (`deepseek-chat`) | api.deepseek.com/v1 | 80k/session (L0), 300k/week (L1+) |
| Deep reasoning, regulatory analysis | DeepSeek Reasoner (`deepseek-reasoner`) | api.deepseek.com/v1 | On-demand, 50k/query max |
| Cross-model review, output validation, compliance audit | Nemotron 3 Super 120B | integrate.api.nvidia.com/v1 | Batch only, 4x/day review cycles |
| Search grounding | Post-MVP (Tavily + Gemini) | — | Not in MVP |

### 2.3 Citation Verification Gate

**Critical path.** Every Hermes response that includes a regulatory reference flows through this gate before reaching the user:

```
Hermes generates response
       │
       ▼
┌─ Citation Verification Gate ────────────────────────────────────────┐
│                                                                       │
│  1. Extract all regulatory citations from response                   │
│     (regex: "RGPD Art. X", "Solvency II Art. Y", "Code des          │
│      Assurances L. Z", "EU AI Act Art. W", "ACPR position...")     │
│                                                                       │
│  2. For each citation:                                               │
│     a. Look up exact text in curated regulatory KB                  │
│        (Supabase `regulatory_corpus` table, version-controlled)     │
│     b. If exact match → stamp as VERIFIED                           │
│     c. If fuzzy match → flag for human review                       │
│     d. If NO match → BLOCK the response                             │
│                                                                       │
│  3. If ALL citations verified → response passes through             │
│     If ANY citation unverified → response blocked, Hermes says:     │
│     "I couldn't verify one of my sources. Let me rephrase without   │
│      the unverified citation."                                       │
│                                                                       │
│  4. Every verification decision → audit_log row (immutable)         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Regulatory KB bootstrap (curated, not LLM-generated):**
- RGPD (GDPR) — full text, article-level
- Code des Assurances — key articles (L113-2, L121-1, etc.)
- EU AI Act — Articles 5, 13, 14, 50
- Solvency II — key provisions
- ACPR positions and recommendations
- FFA annual reports (statistical references only)
- EIOPA guidelines
- DORA (Digital Operational Resilience Act) — relevant articles
- AXA internal policies (if available in structured format)

Seeded via deterministic import scripts from official EUR-Lex and Légifrance sources. **Never** LLM-generated text stored as "regulatory truth."

### 2.4 Output Validation Guard

Secondary safety net. Nemotron 120B scores every Hermes response (batch, async, sampling 20% of production traffic at MVP):

| Check | Threshold |
|---|---|
| Regulatory compliance | Must pass: no hallucinated regulations, no policy violations |
| Factual grounding | Score ≥ 0.9: claims match retrieved context |
| Tone appropriateness | Score ≥ 0.8: professional, non-sycophantic, locale-appropriate |
| Confidentiality | Must pass: no PII, no cross-tenant data leak |

If a response fails, it's flagged in the audit log and Hermes' next response for that thread includes a correction.

---

## 3. Data Architecture

### 3.1 Database Seeding Strategy

**Primary path:** Alembic migrations + deterministic seed scripts.

```
db/
  migrations/
    0001-0010.sql  (existing)
    0011_chat_messages.sql      (NEW)
    0012_regulatory_corpus.sql  (NEW)
    0013_kpi_snapshots.sql      (NEW)
    0014_countries.sql          (NEW)

  seeds/
    seed_tenants.py             → 4 countries (FR, DE, ES, IT)
    seed_pilots.py              → 5 pilots, 3 domains
    seed_scenarios.py           → 6 cockpit_scenarios with 12-18 members each
    seed_runs.py                → 90 days of scenario_runs (2,400+)
    seed_hitl.py                → 80+ hitl_items (pending, approved, overridden, escalated)
    seed_evals.py               → 30+ evals (factual, policy, tone)
    seed_kpi_snapshots.py       → 90 daily snapshots per pilot
    seed_regulatory_corpus.py   → Curated regulation texts from official sources
    seed_audit_log.py           → Hash-chained audit trail
```

**Secondary path:** Hermes conversation wizard. After deterministic seed, Hermes interviews the operator to customize data. Operator confirms each batch before write.

### 3.2 New Tables

```sql
-- Chat message persistence
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL,           -- country or pilot thread
  role TEXT NOT NULL CHECK (role IN ('user','hermes','system','tool')),
  content JSONB NOT NULL,             -- markdown or structured
  citations JSONB,                    -- verified regulatory citations
  langfuse_trace_id TEXT,
  tokens_in INT, tokens_out INT,
  cost_eur NUMERIC(10,4),
  verified BOOLEAN DEFAULT false,    -- passed citation verification gate
  validation_score NUMERIC(3,2),     -- Nemotron output validation score
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regulatory corpus for citation verification
CREATE TABLE regulatory_corpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,               -- 'RGPD', 'Code des Assurances', 'EU AI Act', etc.
  article_ref TEXT NOT NULL,          -- e.g., 'Art. 22 §1'
  full_text TEXT NOT NULL,            -- exact official text
  language TEXT NOT NULL DEFAULT 'fr',
  url TEXT,                           -- official source URL
  version_date DATE NOT NULL,         -- when this text was retrieved
  hash TEXT NOT NULL,                 -- SHA-256 of full_text (tamper detection)
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  UNIQUE(source, article_ref, language)
);

-- KPI snapshots for dashboard performance
CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  pilot_slug TEXT,
  pillar TEXT NOT NULL CHECK (pillar IN ('business','operational','quality')),
  kpi_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kpi_snapshots_lookup ON kpi_snapshots(country, pilot_slug, pillar, snapshot_date);

-- Countries
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  bento_config JSONB DEFAULT '{}',
  blueprint_library_enabled BOOLEAN DEFAULT false,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Implementation Plan

### 4.1 Phase 0 — Foundation (Day 1-2)

**Goal:** OpenClaw + DeepSeek V4 connected. Hermes persona alive.

- SSH into Railway container `openclaw-production-b00e`
- Install OpenClaw stable (`npm install -g openclaw@latest`)
- Create `~/.openclaw/agents/hermes/` with SOUL.md, TOOLS.md, AGENTS.md
- Configure DeepSeek V4 as primary model
- Verify: `openclaw agent --message "Qui es-tu?"` returns Hermes persona
- Gateway `chat_router.py` rewired from mock to OpenClaw API
- Gateway SSE proxy: OpenClaw token stream → cockpit EventSource

**Exit gate:** Type in cockpit chat. Hermes responds via DeepSeek V4 with correct persona, streams live, message persists in Supabase.

### 4.2 Phase 1 — Data Foundation (Day 3-5)

**Goal:** Real data in Supabase. Cockpit pages query live data.

- Run Alembic migrations 0011-0014
- Run all seed scripts → 21 tables populated
- Gateway KPI routes query real Supabase data (not mock JSON)
- Gateway scenario routes query real data
- KPI dashboard shows real sparklines from `kpi_snapshots`
- Scenario grid shows real pilots
- Cockpit pages fetch from gateway API

**Exit gate:** Open `/kpis.html`. Three pillars show real numbers. Sparklines have 90 data points. Heat-map cells populated.

### 4.3 Phase 2 — Gold Droplet UI (Day 5-7)

**Goal:** Hermes' visual identity on all 6 cockpit pages.

- CSS-only gold droplet: radial gradients, breathing glow, ripple animation
- Radial menu: 6 pills fan out on click, staggered cascade
- Replace current AXA-blue sphere on all pages
- Caduceus mark at viewport bottom
- Responsive: adapts at 1024px and 768px
- Accessibility: aria-labels, reduced-motion, keyboard navigation
- Copy: EN/FR/DE/ES/IT for all chrome elements

**Exit gate:** Open any cockpit page. Gold droplet pulses center-bottom. Click → 6 pills fan out. "Open chat" → Hermes speaks with correct persona. Language switches with country selector.

### 4.4 Phase 3 — Core Skills & Citation Gate (Week 2)

**Goal:** Hermes can do real work. Citations are verified.

- 5 core skills built:
  1. `pilot-composer` — compose pilot from conversation
  2. `kpi-analyst` — aggregate and interpret KPIs
  3. `gate-guardian` — monitor HITL gates, surface regulatory risks
  4. `claim-tracer` — trace a claim through agent topology
  5. `compliance-shepherd` — track regulatory requirements per pilot

- Citation Verification Gate implemented:
  - `regulatory_corpus` table populated from official sources
  - Verification middleware in gateway (before response reaches user)
  - Audit log entry for every verification decision

- Output Validation Guard (Nemotron 120B):
  - Batch sampling 20% of production responses
  - Scores: regulatory compliance, factual grounding, tone, confidentiality
  - Failed responses flagged and auto-corrected

**Exit gate:** Type "@motor-fnol-tow show me Gate C decisions this week" in chat. Hermes queries Supabase, returns real data with verified citations. Type a regulatory question — response passes through citation gate.

### 4.5 Phase 4 — Production Hardening (Week 3-4)

**Goal:** Locked down. Audited. Tested.

- AgentShield scan → 0 critical, 0 high
- `openclaw doctor` → all checks green
- DM policy audit → pairing mode, allowlists configured
- Sandbox verification → non-main sessions isolated
- Secret scan → no keys in SOUL.md/TOOLS.md/AGENTS.md
- Secret management → env vars only, no plaintext in config
- Playwright: 6 pages, 0 console errors, all elements present
- E2E: cockpit → Hermes → DeepSeek V4 → citation gate → Supabase → cockpit
- Backend tests: 120 existing + new test suite for Hermes persona, tools, security, citation gate
- Performance: KPI dashboard ≤ 500ms, chat SSE ≤ 100ms first token
- Lighthouse: FCP ≤ 1.2s, LCP ≤ 1.8s, CLS ≤ 0.05

**Exit gate:** `uv run pytest -v` → all pass. `openclaw doctor` → green. Playwright → 6/6, 0 errors. Cockpit loads with real data. Hermes responds with verified citations.

### 4.6 Post-MVP (Month 2-3)

- Nemotron cross-model review pipeline (auto-review-loop pattern)
- External channels: Telegram, Teams, Salesforce, ServiceNow (OpenClaw adapters)
- Tavily web search + Gemini grounding (gated behind feature flag)
- ECC skill substrate expanded: 10 → 50 skills
- Blueprint library: cross-country asset sharing
- Canary rollout ladder: PostHog feature flags for gradual Hermes deployment

---

## 5. Security Model

### 5.1 Defense in Depth

| Layer | Control |
|---|---|
| **Network** | Railway private network. Only 3 public services. Gateway is trust boundary. |
| **Gateway** | CSRF + HMAC on all endpoints. Rate limiting (Slowapi). Tenant isolation. |
| **OpenClaw** | DM pairing mode. Channel allowlists. Docker sandbox (non-main). Allowlisted egress. |
| **AgentShield** | 102 static analysis rules. Secrets detection. Permission auditing. Pre-deploy scan. |
| **Citation Gate** | Every regulatory citation verified against curated KB. Unverified = blocked. |
| **Output Guard** | Nemotron 120B scores sampled responses. Failures auto-corrected. |
| **Supabase** | RLS on all tables. Service role only for gateway. Mandatory audit_log on writes. |
| **Secrets** | Env vars only. Never in config files. Rotation via Railway dashboard. |
| **Audit** | Hash-chained (prev_hash → SHA-256). Immutable. Every Hermes decision traced. |

### 5.2 Session Types

| Session | Access | Sandbox | DM Policy |
|---|---|---|---|
| **Admin** (plateau head) | Full Ring 1 + Ring 2 with signoff | OpenShell | N/A (cockpit) |
| **Operator** (claims) | Ring 1 scoped to assigned pilots. Ring 2: HITL decisions only. | Docker | N/A (cockpit) |
| **External** (Telegram, future) | Ring 1: public info only. Ring 2: none. | Docker, strict allowlist | Pairing required |

### 5.3 Citation Verification (detail)

```python
# gateway/src/gateway/citation_gate.py

@dataclass
class CitationResult:
    citation_ref: str       # e.g., "RGPD Art. 22 §1"
    source: str             # e.g., "RGPD"
    status: str             # verified | fuzzy | missing
    official_text: str | None
    match_type: str | None  # exact | fuzzy_high | fuzzy_low | none

async def verify_citations(response_text: str, tenant_id: str) -> list[CitationResult]:
    """Extract and verify all regulatory citations in a response."""
    citations = extract_citation_refs(response_text)
    results = []
    for ref in citations:
        row = await db.fetch_one(
            "SELECT full_text, source FROM regulatory_corpus "
            "WHERE article_ref = $1 AND tenant_id = $2",
            ref, tenant_id
        )
        if row and exact_match(response_text, row["full_text"]):
            results.append(CitationResult(ref, row["source"], "verified",
                                          row["full_text"], "exact"))
        elif row:
            results.append(CitationResult(ref, row["source"], "fuzzy",
                                          row["full_text"], "fuzzy_high"))
        else:
            results.append(CitationResult(ref, "unknown", "missing", None, None))
    return results
```

---

## 6. Files to Create/Modify

### 6.1 New Files

```
gateway/src/gateway/
  routers/kpis_router.py         (DONE — needs Supabase queries)
  routers/chat_router.py         (DONE — needs OpenClaw integration)
  citation_gate.py               (NEW — citation verification)
  output_guard.py                (NEW — Nemotron output validation)
  seed/                          (NEW — deterministic seed scripts)
    seed_tenants.py
    seed_pilots.py
    seed_scenarios.py
    seed_runs.py
    seed_hitl.py
    seed_evals.py
    seed_kpi_snapshots.py
    seed_regulatory_corpus.py
    seed_audit_log.py

db/migrations/
  0011_chat_messages.sql         (NEW)
  0012_regulatory_corpus.sql     (NEW)
  0013_kpi_snapshots.sql         (NEW)
  0014_countries.sql             (NEW)

OpenClaw config (on Railway):
  ~/.openclaw/agents/hermes/SOUL.md     (NEW)
  ~/.openclaw/agents/hermes/TOOLS.md    (NEW)
  ~/.openclaw/agents/hermes/AGENTS.md   (NEW)
  ~/.openclaw/openclaw.json             (MODIFY — DeepSeek V4 config)

design-proposal/codex-axa/
  kpis.html                       (DONE — refine with real data)
  chat.html                       (DONE — refine with real Hermes)
  codex.css                       (DONE — add gold droplet styles)
  codex.js                        (DONE — add Hermes interaction)
  index.html                      (DONE — updated chrome)
  scenarios.html                  (DONE — updated chrome)
  builder.html                    (DONE — updated chrome)
  canvas.html                     (DONE — updated chrome)
```

### 6.2 Modified Files

```
gateway/src/gateway/main.py       (DONE — new routers registered)
gateway/pyproject.toml            (DONE — ruff per-file-ignores)
docs/architecture.md              (PENDING — §21-23 cockpit sections)
```

---

## 7. Acceptance Criteria (MVP)

| # | Criterion | Evidence |
|---|---|---|
| AC-01 | Hermes responds via DeepSeek V4 with correct persona (SOUL.md) | E2E |
| AC-02 | Chat messages stream via SSE from DeepSeek V4 through gateway to cockpit | Manual + automated |
| AC-03 | Chat messages persist in Supabase `chat_messages`. Survive page refresh. | DB inspection |
| AC-04 | Citation Verification Gate blocks unverified regulatory citations | Unit test + adversarial test |
| AC-05 | Output Validation Guard scores 20% of production responses via Nemotron 120B | DB inspection |
| AC-06 | All 21 Supabase tables populated via deterministic seed scripts | DB row count |
| AC-07 | KPI dashboard shows real data with 90-day sparklines | E2E |
| AC-08 | Scenario grid shows real pilots with correct state indicators | E2E |
| AC-09 | Gold droplet present on all 6 cockpit pages | Playwright screenshot |
| AC-10 | Gold droplet click → radial menu with 6 contextual actions | Playwright + manual |
| AC-11 | Chat slide-over opens from radial menu, closes on Escape/click-outside | E2E |
| AC-12 | Country selector switches country, data reloads | E2E |
| AC-13 | ⌘K command palette works on all pages | E2E |
| AC-14 | All animations respect `prefers-reduced-motion: reduce` | axe-core |
| AC-15 | All interactive elements have aria-labels and focus rings | axe-core |
| AC-16 | 120+ backend tests pass. Ruff clean. JS syntax clean. | CI |
| AC-17 | `openclaw doctor` passes all checks | CLI |
| AC-18 | AgentShield scan returns 0 critical, 0 high | CLI |
| AC-19 | No API keys or secrets in any committed file | Secret scan |
| AC-20 | Hermes responds in correct language when country switches (FR→DE→EN) | E2E |

---

## 8. Risk Registry

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R-01 | DeepSeek V4 API outage | M | H | Fallback to direct model call pattern. Health check endpoint monitors availability. |
| R-02 | Hallucinated citation passes verification gate | L | H | Citation KB is version-controlled and sourced from official texts. Gate blocks fuzzy matches — only exact passes. |
| R-03 | Gold droplet perceived as gimmick | M | M | Substance-first messaging. Every claim verifiable. Operator co-design in post-MVP. |
| R-04 | OpenClaw Railway container crashes | M | H | Health check endpoint. Railway auto-restart. Gateway caches last known state. |
| R-05 | Citation KB incomplete for non-FR jurisdictions | H | M | Bootstrap FR first (primary market). DE/ES/IT added incrementally. |
| R-06 | Token budget exceeded mid-conversation | M | L | Hard pause with clear message. Compaction memos for long threads. User can increase budget. |
| R-07 | Seed scripts produce unrealistic data | M | M | Companion review of seed output. Operator validation step before cockpit goes live. |

---

*Design spec v2.0 — cross-model reviewed. Nemotron 120B + DeepSeek V4 Reasoner. Ready for implementation.*
