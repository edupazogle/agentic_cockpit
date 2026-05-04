# QA Skill Automation — Integration Options Research

**Date:** May 4, 2026  
**Issue:** How to automatically detect `/approve-merge` and `/request-changes` comments and execute actions

---

## Executive Summary

GitHub Copilot **cannot natively listen to Linear webhooks** or poll for new comments autonomously. However, **Linear webhooks + a bridge service** can trigger Copilot commands. Three viable options exist:

| Option | Complexity | Latency | Cost | Feasibility |
|--------|-----------|---------|------|------------|
| **Option 1: Manual Command** | Low | Instant | Free | ✅ Recommended for MVP |
| **Option 2: Linear Webhooks → GitHub Actions** | Medium | <30s | Free | ✅ Viable now |
| **Option 3: Custom Bridge Service** | High | <5s | $5-20/mo | For production |
| **Option 4: Linear + VS Code Polling Agent** | Medium | 5-60s | Free | Experimental |

---

## Linear Webhook Capabilities

**✅ What Linear supports:**
- Webhooks fire on **comment creation** and **comment update**
- Payload includes full comment body, issue ID, creator, timestamp
- Webhook URL receives HTTPS POST with signature verification (HMAC)
- Requires workspace admin permissions to configure

**✅ Webhook events Linear can trigger:**
- `Comment.created`
- `Comment.updated`
- Issues, Projects, Cycles, Labels, Attachments also supported
- Comments from any user on any issue in subscribed team

**❌ Limitations:**
- No native Copilot integration
- Webhooks are "outbound only" — Linear pushes data, doesn't pull
- No built-in "execute command" action in Linear UI
- Linear cannot directly invoke GitHub Copilot

---

## Option 1: Manual Command (MVP) ⭐ RECOMMENDED

### How It Works

```
User posts on Linear: "/approve-merge"
         ↓
User runs manually: /qa-approve AXA-3  (or similar command)
         ↓
Copilot executes merge + state transition
```

### Implementation

Add new commands to QA skill:

```markdown
### Manual Merge Commands

After QA review is posted and user approves:

- `/qa-approve <issue-id>` — Merge branch and move issue to "Done"
- `/qa-request-changes <issue-id>` — Return issue to "In Progress" and notify assignee
```

### Pros
- ✅ **Zero external infrastructure** — no webhooks, services, or polling needed
- ✅ **Instant execution** — user runs command, Copilot acts immediately
- ✅ **Simple to implement** — update skill doc, add 2 command handlers
- ✅ **User has full control** — explicit consent before destructive actions (merge)
- ✅ **No secrets/keys exposed** — all auth handled by Linear MCP in existing env

### Cons
- ❌ Requires user to run a second command after approval (2 steps vs. 1)
- ❌ Not "fully automated" but good enough for MVP phase

### Implementation Time
**15 minutes** — add 2 command sections to QA skill, test locally

### Recommendation
**Use this for Sprint 0–2.** Iterate fast, gather UX feedback, then upgrade to Option 2 if team wants true automation.

---

## Option 2: Linear Webhooks → GitHub Actions Bridge

### How It Works

```
User posts on Linear: "/approve-merge"
         ↓
Linear webhook fires → POST to GitHub Actions dispatch endpoint
         ↓
GitHub Actions workflow triggered with issue ID
         ↓
GHA calls: `gh copilot run /qa-approve AXA-3` (or equivalent)
         ↓
Merge executed, Linear issue updated
```

### Implementation Steps

1. **Set up Linear webhook** (Linear Admin UI)
   - Go to `Settings > Administration > API > Webhooks`
   - Create new webhook for team
   - URL: `https://api.github.com/repos/{owner}/{repo}/dispatches`
   - Trigger: `Comment.created`
   - Filter (optional): only comments matching `/approve-merge` or `/request-changes`

2. **Create GitHub Actions workflow** (`.github/workflows/qa-auto-merge.yml`)

```yaml
name: QA Auto-Merge on Linear Comment

on:
  repository_dispatch:
    types: [linear-qa-approval]

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Parse Linear webhook payload
        run: |
          ISSUE_ID=$(echo '${{ github.event.client_payload.issueId }}' | tr -d ' ')
          COMMAND=$(echo '${{ github.event.client_payload.command }}')
          echo "ISSUE_ID=$ISSUE_ID" >> $GITHUB_ENV
          echo "COMMAND=$COMMAND" >> $GITHUB_ENV
      
      - name: Run Copilot QA command
        run: |
          # Requires Copilot CLI installed
          /usr/local/bin/copilot-cli run "/qa-${COMMAND} ${ISSUE_ID}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

3. **Verify webhook signature** (security check in GHA)

```yaml
- name: Verify Linear webhook signature
  run: |
    # Linear sends X-Linear-Signature header (HMAC-SHA256)
    python3 - <<EOF
    import hmac, hashlib, json
    secret = "${{ secrets.LINEAR_WEBHOOK_SECRET }}"
    payload = """${{ github.event.client_payload }}"""
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    # Compare against header
    EOF
```

### Prerequisites
- GitHub repo with Actions enabled
- Copilot CLI installed in runner (may not be available yet)
- Repository dispatch token (built-in)
- Linear API key in GitHub Secrets

### Pros
- ✅ Automatic — comment triggers action without user running command
- ✅ ~30 second latency (GHA queue time)
- ✅ Full audit trail in GitHub Actions logs
- ✅ Can add approval gates (require 2 approvals before merge)
- ✅ Extensible — add other Linear webhook types (cycle status, priority change)

### Cons
- ❌ Requires Copilot CLI support in GitHub Actions runner (not GA yet)
- ❌ Linear webhook URL is public (but signature verified)
- ❌ Extra secrets management (LINEAR_WEBHOOK_SECRET in GHA)
- ❌ Debugging requires checking both Linear and GHA logs
- ❌ GitHub Actions SLA is "best effort" (rare failures possible)

### Implementation Time
**1–2 hours** — webhook config (5 min), GHA workflow (45 min), local testing (45 min), secret setup (15 min)

### Blocker
**Copilot CLI must support `/qa-*` commands** or GHA must be able to invoke them. Current status unknown — may need VS Code extension work.

---

## Option 3: Custom Bridge Service

### How It Works

```
User posts on Linear: "/approve-merge"
         ↓
Linear webhook → POST to custom bridge service (Node.js/Python)
         ↓
Bridge parses comment, validates signature
         ↓
Bridge calls Linear MCP to merge branch + update issue
         ↓
Bridge logs action, returns 200 to Linear
```

### Implementation

**Bridge service** (Node.js + Express):

```javascript
// bridge-service/src/index.ts
import express from 'express';
import crypto from 'crypto';
import { LinearClient } from '@linear/sdk';

const app = express();
const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET;
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

app.post('/webhooks/linear/qa', (req, res) => {
  // Verify signature
  const signature = req.headers['x-linear-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', LINEAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { data } = req.body;
  if (data.type !== 'Comment') return res.status(200).json({ ok: true });

  const comment = data.data;
  const issueId = comment.issue.id;
  const body = comment.body || '';

  // Parse command
  let command = null;
  if (body.includes('/approve-merge')) command = 'approve-merge';
  if (body.includes('/request-changes')) command = 'request-changes';

  if (!command) {
    return res.status(200).json({ ok: true, action: 'ignored' });
  }

  // Execute via Linear API
  executeQACommand(issueId, command)
    .then(() => res.status(200).json({ ok: true, action: command, issueId }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
});

async function executeQACommand(issueId, command) {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY });
  
  if (command === 'approve-merge') {
    // Get issue details
    const issue = await client.issue(issueId);
    
    // Merge the branch
    const branch = issue.gitBranchName;
    await mergeBranch(branch); // Uses GitHub API
    
    // Move issue to Done
    await client.issueUpdate(issueId, { stateId: 'done' });
    
    // Post comment
    await client.commentCreate({
      issueId,
      body: '✅ **Merge approved by user.** Branch merged to main. Issue moved to Done.'
    });
  } else if (command === 'request-changes') {
    await client.issueUpdate(issueId, { stateId: 'in-progress' });
    await client.commentCreate({
      issueId,
      body: '🔄 **Changes requested.** Issue returned to In Progress.'
    });
  }
}

app.listen(3000, () => console.log('Bridge ready on :3000'));
```

### Deployment

Host on Railway/Heroku/Cloud Run:

```bash
# Railway example
railway link
railway up
```

### Pros
- ✅ True real-time automation — <5 second latency
- ✅ Full control over command parsing and error handling
- ✅ Can implement complex logic (e.g., require 2 approvals, check CI status)
- ✅ Decoupled from GitHub Actions (works offline)
- ✅ Direct Linear MCP access — no CLI needed
- ✅ Comprehensive logging and audit trail

### Cons
- ❌ Operational overhead — must run a service, monitor health, handle restarts
- ❌ ~$5–20/month hosting cost
- ❌ Risk: if bridge service down, webhooks are silently dropped (no retry)
- ❌ Security: must store LINEAR_API_KEY in service
- ❌ More code to maintain

### Implementation Time
**3–4 hours** — service scaffold (30 min), webhook parsing (30 min), Linear API calls (1 hour), deployment + testing (1.5 hours)

---

## Option 4: VS Code Polling Agent (Experimental)

### Concept

Copilot runs a background agent that periodically polls Linear issue comments:

```
Every 30 seconds:
  → Fetch recent comments on open "In Review" issues
  → Parse for `/approve-merge` or `/request-changes`
  → Execute via Linear MCP
  → Mark comment as "processed" (custom field or reaction)
```

### Implementation

Add to QA skill or new `qa-automation` skill:

```python
# pseudo-code
import time
from linear_mcp import LinearClient

def polling_agent():
    client = LinearClient()
    processed = set()  # Track which comments we've seen
    
    while True:
        issues = client.list_issues(status="In Review")
        
        for issue in issues:
            for comment in issue.comments:
                if comment.id in processed:
                    continue
                
                if '/approve-merge' in comment.body:
                    merge_and_close(issue)
                    processed.add(comment.id)
                elif '/request-changes' in comment.body:
                    return_to_progress(issue)
                    processed.add(comment.id)
        
        time.sleep(30)  # Poll every 30 seconds
```

### Pros
- ✅ Works entirely within Copilot
- ✅ No external webhooks or services
- ✅ Configurable poll interval (trade latency vs. API quota)

### Cons
- ❌ **Latency is 5–60 seconds** (depending on poll interval)
- ❌ **Polling is inefficient** — queries Linear every 30 seconds even if nothing happened
- ❌ **No guarantee of execution** — if Copilot closes, agent stops
- ❌ Requires custom "processed" tracking to avoid duplicates
- ❌ Complex state management

### Recommendation
**Not recommended** unless you want to avoid webhooks entirely. Option 1 (manual) is simpler, Option 2 (GHA) is better automated.

---

## Summary Table

| Feature | Option 1 | Option 2 | Option 3 | Option 4 |
|---------|----------|----------|----------|----------|
| Automation | Manual | Auto | Auto | Auto |
| Latency | Instant | 30s | 5s | 30s+ |
| Infrastructure | None | GitHub | Custom service | None |
| Cost | Free | Free | $5–20/mo | Free |
| Complexity | Low | Medium | High | Medium |
| Reliability | 100% | 99% | 95% | 80% |
| Linear Webhook needed | No | Yes | Yes | No |
| Ready for MVP | ✅ Yes | ✅ Soon | ⚠️ Later | ❌ No |

---

## Recommended Path

### Phase 1 (Sprint 0–1): **Option 1 — Manual Commands**

Update QA skill:

```markdown
## User-Triggered Merge

After QA review posts recommendation:

**Approve merge:**
```
/qa-approve <issue-id>
```
→ Merges branch to main, transitions issue to "Done"

**Request changes:**
```
/qa-request-changes <issue-id>
```
→ Returns issue to "In Progress", notifies assignee
```

**Implementation:** 30 minutes. User posts `/approve-merge` comment on Linear, then runs `/qa-approve AXA-3` in Copilot. Done.

---

### Phase 2 (Sprint 2–3): **Option 2 — GitHub Actions Automation**

Once Copilot CLI is GA and supports custom commands:
- Set up Linear webhook in workspace
- Create GHA workflow to trigger on comment
- Parse `/approve-merge` → call `copilot run /qa-approve AXA-N`
- Full end-to-end automation

**Implementation:** 1–2 hours.

---

### Phase 3 (Later): **Option 3 — Custom Bridge (if needed)**

If you need <5s latency and can afford to run a service:
- Deploy custom Node.js bridge
- More control over parsing, logging, error handling
- Overkill for small team, good for scale

**Implementation:** 3–4 hours.

---

## Linear Webhook Setup (for Options 2 & 3)

When ready, follow this:

**Step 1: Get webhook secret**
- Go to `Settings > Administration > API > Webhooks`
- Click `+ Webhook`
- Select team and events:
  - ✅ `Comment.created`
  - ✅ `Comment.updated`
- Enter webhook URL: `https://your-service.com/webhooks/linear/qa`
- Copy webhook secret (for signature verification)

**Step 2: Configure in environment**
```bash
LINEAR_WEBHOOK_SECRET="xxxx-xxxx-xxxx-xxxx"
LINEAR_WEBHOOK_URL="https://your-service.com/webhooks/linear/qa"
```

**Step 3: Verify signature on incoming requests**

Linear sends `X-Linear-Signature: sha256=<hmac>` header.

---

## Proposed Next Steps

1. **Implement Option 1** (manual commands) in QA skill — 30 min, Sprint 0 finish
2. **Document** webhook requirements for Phase 2 in this file
3. **Monitor feedback** from `/approve-merge` usage
4. **Plan Option 2 upgrade** for Sprint 2 if team wants full automation

---

## References

- Linear API Docs: https://developers.linear.app/docs/api-and-webhooks
- Linear Webhook Documentation: https://developers.linear.app/docs/webhooks
- GitHub Actions Repository Dispatch: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#repository_dispatch
- Webhook Signature Verification: https://en.wikipedia.org/wiki/HMAC
