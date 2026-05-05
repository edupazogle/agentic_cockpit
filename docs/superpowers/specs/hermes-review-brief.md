# Hermes Design — Cross-Model Review Brief

> Reviewed by: Nemotron 3 Super 120B (NVIDIA NIM) + DeepSeek V4 Pro (NVIDIA NIM)
> Date: 2026-05-05

## Design Under Review

### 1. The Agent Persona — "Hermes"

Hermes is a gold-droplet AI agent for the GDAI Agentic Cockpit (AXA insurance). Named after the Greek god of messengers and boundaries, he is the only entity trusted to cross every boundary in the cockpit: executive KPIs (Olympus), operator claims handling (earth), and audit/compliance (underworld).

- **Visual:** A molten gold droplet with liquid-glass refraction. On click, 6 action pills fan out radially (3 left, 3 right).
- **Voice:** Senior partner, not chatbot. Direct, warm, precise. French vouvoiement. Never sycophantic.
- **Mission:** Guide insurance pilots from first idea to production. Cite regulatory sources. Push back when the user is wrong.

### 2. Three-Layer Architecture

```
HERMES (Operator Shell) → OPENCLAW (Agent Runtime) → ECC (Skill Substrate)
```

- **Hermes:** Persona, voice, gold droplet UI, model routing
- **OpenClaw:** Multi-channel gateway (WebChat, Telegram, Teams), sandboxed execution, tool system, cron
- **ECC:** 182 skills, 48 subagents, hooks, TDD, security review, verification loops

### 3. Model Routing

- DeepSeek V4 Pro → Insurance domain queries, tool calling, structured output
- Nemotron 3 Super 120B → Regulation search, compliance reasoning, long-form analysis
- Gemini 2.5 Pro → Web search grounding (Tavily integration)
- Budget enforcement via ECC cost-aware-llm-pipeline

### 4. Security Model — "The Caduceus"

Three rings of trust:
- **Ring 1 (Olympus):** Read all — pilots, KPIs, evals, audit logs
- **Ring 2 (Earth):** Write with human gates — propose diffs, generate data, draft documents. User must approve.
- **Ring 3 (Underworld):** Forbidden — no production writes, no bypassing regulatory gates, no invented citations, no deploying without user signoff

Defense in depth: OpenClaw DM pairing + sandboxing → AgentShield 102 rules → ClawHub security skills → Supabase RLS + audit chaining

### 5. Implementation Phases

0. OpenClaw + ECC baseline (Day 1)
1. Real LLM streaming + persistence (Day 2-3)
2. Gold droplet UI (Day 3-4)
3. Skills & tools (Day 4-6)
4. Seed via Hermes conversation (Day 6-7)
5. Production hardening (Day 7-8)
6. External channels (post-MVP)

### 6. Data Architecture

- 21 Supabase tables, all empty → Hermes seeds via conversation
- Gateway (FastAPI) as trust boundary between Next.js and Supabase
- Langfuse for tracing every Hermes turn
- KPI snapshots materialized every 6h

### 7. Companion Capabilities (TOOLS.md)

Six domains: Cockpit queries, Research (Tavily), Composition (pilot building), Operations (run analysis), Communication (decks, memos), HITL (decisions)

### 8. Channel Strategy

Launch: Cockpit WebChat + Chatwoot widget
Future: Telegram, Microsoft Teams, Salesforce, ServiceNow (via OpenClaw adapters)

---

## Review Questions

Please review this design as a senior AI architect with insurance/regulated-industry experience. Score each area 1-10 and identify:

1. **Architecture weaknesses:** What will break at scale? What's over-engineered? What's missing?
2. **Security gaps:** What threat vectors are unaddressed? What's the weakest link?
3. **Persona risks:** Will insurance operators trust a gold droplet named after a Greek god? What cultural or adoption risks exist?
4. **Implementation feasibility:** Can this really be built in 8 days? What's being underestimated?
5. **Integration complexity:** OpenClaw + ECC + NVIDIA NIM + DeepSeek V4 + Supabase + Langfuse — too many moving parts?
6. **The ONE thing you would change:** What single decision would most improve this design?

Be brutally honest. This design ships to production.
