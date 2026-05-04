# BugClaw — Stakeholder Issue Agent via OpenClaw + Chatwoot

**Date:** 2026-05-04
**Status:** Planned
**Depends on:** OpenClaw Railway service (deployed), Chatwoot instance (running locally, needs Railway deployment)

## Summary

Deploy BugClaw, an OpenClaw-powered autonomous agent that lets stakeholders submit bugs and feature requests via Chatwoot. Bugs are auto-fixed by OpenClaw. Features route to the standard brainstorm→sprint→deliver pipeline. Eduardo remains the sole merge gate.

## Scope

### In scope
1. Fork and fix `arjunkomath/openclaw-railway-template` — fix POST body proxy bug
2. Configure BugClaw agent persona in OpenClaw
3. Create Chatwoot stakeholder inbox + webhook
4. Wire Chatwoot webhook → OpenClaw hooks → Linear issue creation
5. End-to-end test: stakeholder message → Linear issue → auto-fix → QA report

### Out of scope
- Chatwoot Railway deployment (use local instance for testing)
- WhatsApp/Telegram channels (Chatwoot web widget only for v1)
- Multi-stakeholder access control
- BugClaw handling database migrations or infra changes

## Architecture

```
Stakeholder → Chatwoot widget → Chatwoot webhook → OpenClaw (/hooks) → BugClaw agent
                                                                           │
                                                                    ┌──────┴──────┐
                                                                    │             │
                                                                   🐛 Bug     💡 Feature
                                                                    │             │
                                                              Auto-fix + QA   /brainstorm
                                                                    │        /sprint
                                                              Linear issue   /deliver
                                                                    │             │
                                                              QA report posted to:
                                                              • Chatwoot (stakeholder)
                                                              • Linear (Eduardo)
                                                                    │
                                                              ✋ /approve-merge
                                                                    │
                                                              ✅ Done
```

## Implementation steps

### Phase 1: Fork and fix OpenClaw template (POST body bug)

1. Fork `arjunkomath/openclaw-railway-template` to org account
2. Fix `src/server.js`: Remove global `express.json()`, add per-route JSON parsing for `/setup/*` POST routes
3. Update Railway service to point at forked repo
4. Redeploy and verify POST `/v1/chat/completions` works on public endpoint

**Fix details:**
```javascript
// BEFORE (broken):
app.use(express.json({ limit: "1mb" }));
// ... later ...
return proxy.web(req, res, { target: GATEWAY_TARGET });

// AFTER (fixed):
// Remove global express.json()
// Add per-route: express.json({ limit: "1mb" }) to each /setup/api/* POST route
// Proxy receives raw body stream correctly
```

### Phase 2: BugClaw agent persona

1. SSH into OpenClaw container
2. Configure agent personality via OpenClaw config:
   - Name: BugClaw
   - System prompt: Issue triage specialist
   - Tools: Linear API, GitHub API
3. Create BugClaw workspace with AGENTS.md configuring behavior:

```markdown
# BugClaw — Stakeholder Issue Agent

You are BugClaw, the AXA GDAI issue triage agent.

## Triage protocol

When a stakeholder submits a report:
1. Classify: Bug or Feature Request
2. For bugs: collect reproduction steps, screenshots, chat ID, environment
3. For features: collect user story, acceptance criteria, priority
4. Ask follow-ups one at a time until you have enough to create a Linear issue
5. Create the Linear issue with labels and full context
6. Post the Linear link in the Chatwoot thread

## Bug auto-fix protocol

When bug is confirmed:
1. Create branch: fix/bugclaw/<slug>
2. Implement fix
3. Write/update tests
4. Open PR
5. Post QA report to Chatwoot thread
6. Await Eduardo's /approve-merge

## Never
- Never merge without Eduardo's approval
- Never access production databases directly
- Never modify auth or security boundaries
- Never share Linear links with stakeholders (they can't access)
```

### Phase 3: Chatwoot integration

1. Create new Chatwoot inbox "Stakeholder Feedback" (Channel::Api)
2. Create webhook pointing to OpenClaw hooks endpoint:
   - URL: `https://openclaw-fsxk-production.up.railway.app/hooks`
   - Auth: `Bearer <OPENCLAW_GATEWAY_TOKEN>`
   - Events: message_created, message_updated
3. Test webhook delivery with curl
4. Verify OpenClaw hooks endpoint receives and processes payload

### Phase 4: Linear integration

1. Configure BugClaw with Linear API key (from `.env.local`: `LINEAR_API_KEY`)
2. Test Linear issue creation via BugClaw
3. Verify labels applied: `Stakeholder`, `Chatwoot`, `Bug` or `Feature Request`
4. Verify issue appears in Agentic Cockpit project

### Phase 5: End-to-end test

1. Send test message via Chatwoot widget: "The claim details page shows wrong policy number"
2. BugClaw responds: "Thanks! What's the claim ID and chat ID? Can you share a screenshot?"
3. Respond with details
4. BugClaw creates Linear issue
5. BugClaw auto-fixes, posts QA report
6. Eduardo reviews and `/approve-merge`
7. Stakeholder gets confirmation in Chatwoot: "Fixed and deployed!"

## Acceptance criteria

- [x] (pending) POST `/v1/chat/completions` works on public OpenClaw endpoint
- [ ] BugClaw persona responds to Chatwoot messages with triage questions
- [ ] BugClaw correctly classifies bugs vs features
- [ ] BugClaw creates properly labeled Linear issues
- [ ] BugClaw auto-fixes a simple bug end-to-end
- [ ] BugClaw posts QA report to both Chatwoot and Linear
- [ ] Eduardo can `/approve-merge` from Linear
- [ ] Stakeholder receives final confirmation in Chatwoot

## Risks

| Risk | Mitigation |
|---|---|
| POST proxy bug not fixed by fork | Test immediately after redeploy; fallback to SSH tunnel |
| Chatwoot webhook not received by OpenClaw | Verify hooks path is `/hooks` and auth header is correct |
| BugClaw persona too chatty / not collecting enough info | Tune system prompt after first test |
| Linear API rate limiting | BugClaw creates max ~5 issues/day — well within limits |
| OpenClaw agent workspace not persisting across redeploys | Workspace on `/data/workspace` (persistent volume) |

## Definition of done

1. Forked template deployed, POST proxy bug fixed
2. BugClaw agent persona configured and responsive
3. Chatwoot → OpenClaw webhook flowing
4. Linear issue auto-creation working
5. One complete bug auto-fix e2e test passes
6. One feature request routing to Track A passes
7. Design doc updated with results
