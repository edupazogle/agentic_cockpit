# Sprint BugClaw — Stakeholder Issue Agent

**Duration:** Week 1 (1-2 days)
**Persona promise:** Stakeholders can report bugs and request features via Chatwoot widget; bugs are auto-fixed by OpenClaw; Eduardo approves via Linear.
**Depends on:** Sprint 0 (Repo Recovery Gate), OpenClaw Railway service

---

## Why This Sprint Exists

Stakeholders and business users have no channel to report bugs or propose enhancements. They need a simple Chatwoot widget to submit issues. Reports should auto-create Linear issues. Bugs should be auto-fixed by OpenClaw. Features route to the standard brainstorm→deliver pipeline. Eduardo remains the sole merge gate.

---

## Scope Summary

### In Scope
- Fork `arjunkomath/openclaw-railway-template` — fix POST body bug in proxy
- Configure BugClaw agent persona in OpenClaw
- Create Chatwoot stakeholder inbox + webhook
- Wire Chatwoot webhook → OpenClaw hooks → Linear issue creation
- End-to-end test: stakeholder message → Linear issue → auto-fix → QA report

### Out of Scope
- Chatwoot Railway deployment (use local instance for testing)
- WhatsApp/Telegram channels (Chatwoot web widget only for v1)
- Multi-stakeholder access control
- BugClaw handling database migrations

---

## Implementation Diagram

```mermaid
flowchart LR
    subgraph Stakeholder
      W[Chatwoot Widget]
    end

    subgraph Chatwoot
      IB[Inbox: Stakeholder Feedback]
      WH[Webhook: message.created]
    end

    subgraph "OpenClaw (Railway)"
      HK[/hooks endpoint]
      BC[BugClaw Agent]
    end

    subgraph Linear
      LI[Linear Issue]
    end

    subgraph GitHub
      GH[PR + auto-qa]
    end

    W -->|message| IB
    IB -->|webhook| HK
    HK -->|parse| BC
    BC -->|classify| LI
    BC -->|bug fix| GH
    GH -->|QA report| LI

    style BC fill:#10b981,stroke:#333
    style HK fill:#10b981,stroke:#333
    style W fill:#f59e0b,stroke:#333
    style WH fill:#f59e0b,stroke:#333
```

---

## Technical Implementation

### Phase 1: Template fork
- Fork `arjunkomath/openclaw-railway-template` → `edupazogle/openclaw-railway-template`
- Fix `src/server.js`: Remove global `express.json()`, add per-route JSON parsing
- Point Railway service at forked repo

### Phase 2: BugClaw agent persona
- SSH into OpenClaw container
- Configure agent via `data/.openclaw/` config
- System prompt: triage specialist, collects info, classifies bugs vs features

### Phase 3: Chatwoot integration
- Create new inbox "Stakeholder Feedback"
- Create webhook → OpenClaw `/hooks` endpoint
- Test message flow

### Phase 4: Linear integration
- Configure Linear API key in OpenClaw
- Test issue creation
- Verify labels and project

---

## Skills & MCP Servers

| Skill | Purpose |
|---|---|
| `railway` | OpenClaw provisioning, SSH, logs |
| `n8n` | Chatwoot webhook config |
| `chatwoot` | HITL handover, webhook signatures |

| MCP | Purpose |
|---|---|
| `Railway` | Service status, logs |
| `linear` | Issue creation, verification |
| `n8n-mcp` | Workflow validation |

---

## Acceptance Criteria

| ID | Criterion | Measurable outcome |
|---|---|---|
| AC-BC-01 | Forked template deployed, POST proxy bug fixed | `POST /v1/chat/completions` returns JSON on public endpoint |
| AC-BC-02 | BugClaw agent persona configured | Agent responds with triage persona when queried |
| AC-BC-03 | Chatwoot inbox created and webhook wired | Message in inbox triggers webhook delivery |
| AC-BC-04 | BugClaw creates Linear issues | Issue appears in Agentic Cockpit project with correct labels |
| AC-BC-05 | E2E bug auto-fix test passes | Stakeholder message → Linear issue → auto-fix → QA report |

---

## Sprint Review / Demo

### Demo flow
1. **Context (30s):** Stakeholder finds a bug on the claims page
2. **Action (2m):** Opens Chatwoot widget → describes bug → uploads screenshot → BugClaw collects details → creates Linear issue → auto-fixes → posts QA report
3. **Evidence (1m):** Linear issue URL, Chatwoot thread, GitHub PR, QA checklist
4. **Decision ask:** Should BugClaw auto-fix be gated behind a PostHog feature flag?

---

## Definition of Done

1. Forked template deployed, POST bug confirmed fixed
2. BugClaw agent persona responsive via API
3. Chatwoot webhook firing to OpenClaw hooks
4. Linear issue auto-creation working
5. One complete bug auto-fix e2e test passes
6. Feature request routing to Track A confirmed
7. GitHub Actions: auto-qa.yml creates QA issue, approve-merge.yml handles merge gate
