# QA Automation: Final Comparison & Recommendation

**Date:** May 4, 2026  
**Context:** You discovered GitHub Copilot Agent is assignable in Linear and asked for automation proposal

---

## All Three Approaches Compared

| Factor | Agent-Based | Manual Commands | Webhooks |
|--------|-------------|-----------------|----------|
| **Setup time** | 15 min | 5 min | 1-2 hours |
| **Infrastructure** | None (Linear native) | None | GHA workflow |
| **Latency** | Immediate | Instant | 30 seconds |
| **User actions** | 1 (assign) | 2 (approve + confirm) | 1 (approve) |
| **Visibility in Linear** | ✅ Shows agent assignment | ⚠️ Requires Copilot CLI | ❌ Requires GHA logs |
| **Scalability** | ✅ Foundation for other tasks | ❌ One-off commands | ✅ Extensible workflows |
| **Automation level** | 95% | 60% | 99% |
| **Ready now** | ✅ Yes | ✅ Yes | ⚠️ Sprint 2 |
| **Native to Linear** | ✅ Yes | ⚠️ Via Linear MCP | ❌ External |

---

## Recommended Roadmap

### Sprint 0–1: GitHub Copilot Agent ⭐

**What:**
- Write agent guidance (15 min)
- Assign Copilot when issue → "In Review"
- Agent runs full QA workflow

**Effort:** 15 minutes setup + ongoing manual assignment

**Advantages:**
- Native Linear integration
- Fully visible to team
- Foundation for future automations
- Works immediately

**Implementation:** See `docs/copilot-agent-setup-quick-start.md`

---

### Sprint 1 Parallel: Manual Commands (Backup)

**What:**
- Use if agent encounters issues
- `/qa-approve <issue-id>` as fallback
- Keeps workflow going while agent matures

**Effort:** 5 minutes to understand commands

**Why keep it:**
- Safety net if Copilot agent fails
- Explicit user control (no silent merges)
- Simple backup path

**Implementation:** Just use `/qa-approve` and `/qa-request-changes` commands directly

---

### Sprint 2: Auto-Assignment + Webhooks

**What:**
- Auto-assign Copilot when status → "In Review" (Linear automation rule)
- OR: Set up GitHub Actions webhook for comment detection
- Result: Zero manual steps

**Effort:** 30 minutes (rule) or 1-2 hours (webhooks)

**Why upgrade:**
- Fully hands-off after issue moves to "In Review"
- Webhook latency still <30 seconds
- More reliable than polling

---

## The Decision Framework

### Use GitHub Copilot Agent if:
- ✅ You want zero setup friction (15 min)
- ✅ You want full visibility in Linear UI
- ✅ You want a foundation for other agent tasks
- ✅ You're OK with manual assignment (for now)
- ✅ Team is >2 people (agent delegation makes sense)

### Use Manual Commands if:
- ✅ You want absolute simplicity (no agent setup)
- ✅ You prefer explicit control (2 commands)
- ✅ You're solo (no delegation needed)
- ✅ You like Copilot CLI interaction
- ✅ You want a fallback path

### Use Webhooks if:
- ✅ You need fully hands-off automation
- ✅ You're ready for external infrastructure
- ✅ You want <30 second latency
- ✅ You have DevOps capacity
- ✅ You want to integrate with GitHub Actions

---

## Actual Implementation (Right Now)

### Step 1: Test GitHub Copilot Agent (30 minutes)

```bash
# Terminal
1. Go to Linear workspace
2. Settings > Agents > Additional guidance
3. Paste the guidance template (see quick-start guide)
4. Find next issue in "In Review" status
5. Assign to GitHub Copilot
6. Watch it run /qa automatically
7. Post /qa-approve comment
8. Verify merge happens
```

### Step 2: If Agent Works → You're Done (Sprint 0)

You now have:
- ✅ Full QA automation
- ✅ Native Linear integration
- ✅ Visible agent activity

Proceed to Phase 2 (auto-assignment) in Sprint 2.

### Step 3: If Agent Has Issues → Use Manual Commands (Fallback)

```bash
# Terminal
1. When issue is in "In Review"
2. Run: /qa <issue-id>
3. Review output
4. Run: /qa-approve <issue-id>
# Done!
```

This is still 90% automated; you just issue 2 commands instead of relying on agent assignment.

### Step 4: Sprint 2 → Webhooks (if needed)

Once you outgrow agent approach:
- Set up GitHub Actions workflow
- Linux webhook to detect `/qa-approve` comment
- Fully hands-off

---

## Implementation Checklist

### This Week (Sprint 0)
- [ ] Read `docs/copilot-agent-setup-quick-start.md`
- [ ] Write agent guidance in Linear (15 min)
- [ ] Test with next "In Review" issue
- [ ] Document any issues encountered

### If Agent Works
- [ ] Mark task done
- [ ] Plan Sprint 1 auto-assignment rule

### If Agent Needs Fallback
- [ ] Switch to manual `/qa-approve` commands
- [ ] Document blocker
- [ ] Plan webhook solution for Sprint 2

---

## Why This Recommendation

**GitHub Copilot Agent is the best choice because:**

1. **It's already there:** Visible in your Linear workspace (screenshot shows it)
2. **It's made for this:** Linear designed agents specifically for delegation and automation
3. **It's fastest to implement:** 15 min vs. 1-2 hours for webhooks
4. **It's the foundation:** Other agents (docs, security review) can use same guidance system
5. **It's visible:** All activity in Linear UI, team can see what's happening
6. **It scales:** From manual assignment (Sprint 0) to auto-assignment (Sprint 2) without changes

**Manual commands are the safety net:** If agent fails, you still have a simple 2-command workflow.

**Webhooks are the future:** Once you know automation needs, upgrade to webhooks for full hands-off.

---

## Bottom Line

```
Today:        Agent (15 min setup) + Manual commands (fallback)
Sprint 1:     Agent + Auto-assignment rule
Sprint 2:     Webhooks (if you need <5s latency)
```

**Next action:** Go to Linear, write the agent guidance, assign Copilot to your next "In Review" issue, and watch it work. ✨
