# GitHub Copilot Agent Setup — API-Driven Approach

**Goal:** Programmatically configure Copilot Agent guidance using Linear GraphQL API  
**Time:** 5 minutes  
**Difficulty:** Easy (script handles everything)

---

## Why API-Driven?

Instead of clicking through Linear UI manually, we use the Linear GraphQL API to:
- ✅ Set workspace-level agent guidance automatically
- ✅ Store configuration in code (version-controlled)
- ✅ Enable CI/CD to re-apply on deployments
- ✅ Keep setup reproducible across teams

---

## Setup: Two Steps

### Step 1: Get Your Linear API Key (2 minutes)

1. **Go to Linear API settings:**
   ```
   https://linear.app/settings/api
   ```

2. **Click "Create new API key"**

3. **Configure it:**
   - Name: `Agentic Agent Setup`
   - Scopes: Select **Admin** (or manually select `teams.write` + `workspace.write`)
   - Click **Create**

4. **Copy the key** (you won't see it again)

### Step 2: Run the Setup Script (3 minutes)

From the repo root:

```bash
python3 scripts/setup_agent_guidance.py
```

The script will:

1. **Check for LINEAR_API_KEY** in `.env.local`
   - If missing, it will prompt you to paste it
   - Can optionally save it to `.env.local` for future runs

2. **Verify the API key** by testing it against Linear API
   - Shows your email to confirm identity

3. **List your teams** so you know the setup scope

4. **Set workspace-level guidance** via GraphQL mutation
   - Uploads the agent guidance template
   - Confirms success

5. **Done!** Ready to use

---

## What Gets Configured?

The script sets this guidance at the workspace level:

```markdown
# GitHub Copilot QA Agent

## Purpose
Automate QA reviews and merging for issues in "In Review" status.

## When I'm Assigned to an Issue

I will:
1. Run a full QA review using: `/qa <issue-id>`
2. Post structured feedback with 4 checklists (SOLID, Security, Quality, Removals)
3. Wait for user decision

## When User Comments: "/qa-approve"

I will:
1. Execute: `/qa-approve <issue-id>`
2. This merges the branch to main
3. This transitions the issue to "Done"
4. I'll post a success confirmation

## When User Comments: "/qa-request-changes"

I will:
1. Execute: `/qa-request-changes <issue-id>`
2. This returns the issue to "In Progress"
3. I'll notify the assignee of needed changes

## Important Rules

- ✅ Always run full `/qa` review first
- ✅ Never merge without explicit `/qa-approve` command
- ✅ If blockers found, recommend `/qa-request-changes`
- ✅ Post clear, helpful comments
- ✅ If no response for 24h, post a reminder

## Team Conventions

- Branch naming: `<team>/<issue-id>-<slug>`
- PR title must include issue ID
- All merges must have passing CI
```

---

## How to Use It

Once setup is complete:

### Daily Workflow

1. **Create a GitHub PR** for your feature
2. **Create Linear issue** in "Draft" status
3. **Move to "In Progress"** when ready to work
4. **When done, move to "In Review"**
5. **Assign to GitHub Copilot agent** (select in assignee dropdown)
6. **Copilot automatically:**
   - Reads your guidance
   - Runs `/qa <issue-id>` 
   - Posts full QA review with 4 checklists
   - Waits for approval
7. **You comment:** `/qa-approve`
8. **Copilot automatically:**
   - Merges the branch to main
   - Transitions issue to Done
   - Posts success confirmation ✅

### If Issues Found

If Copilot's review finds issues:

1. **Read the feedback**
2. **Comment:** `/qa-request-changes`
3. **Copilot:** Moves issue back to "In Progress"
4. **Make fixes** and move back to "In Review"
5. **Repeat until approved**

---

## Troubleshooting

### "API key is invalid"

- Check you copied the full key (usually 40+ characters)
- Verify scopes: Admin or (teams.write + workspace.write)
- Delete and recreate: https://linear.app/settings/api

### "Insufficient permissions"

- Your API key may lack write permissions
- Try selecting **Admin** scope instead of individual scopes
- If you're not a workspace admin, ask your workspace owner to create the key

### "Script can't find curl"

- Ensure `curl` is installed: `which curl`
- On macOS: `brew install curl`
- On Ubuntu: `sudo apt-get install curl`

### "Setup worked but Copilot doesn't respond"

- Verify Copilot is assigned: Check issue assignee dropdown
- Check issue status is exactly "In Review"
- Wait a few seconds (Linear webhooks may have latency)
- Check Copilot's activity: Look for your comments on the issue

---

## Advanced: Custom Guidance

To modify the guidance:

1. Edit `AGENT_GUIDANCE` in `scripts/setup_agent_guidance.py`
2. Run the script again
3. Copilot will be updated with new guidance

Example customizations:

```markdown
# Add this to your guidance:

## Special Rules

- Always add a linked subtask for follow-up work
- Never merge on Fridays (queue for Monday)
- If changes touch /gateway, assign to @backend-team

## Escalation

If you find critical issues:
1. Don't merge
2. Add "escalation/security" label
3. Comment: "Security issue found, escalating"
4. Notify @security-leads
```

---

## CI/CD Integration

To auto-run this in your deployment pipeline:

```bash
# In your CI/CD script:
if [ -n "$LINEAR_API_KEY" ]; then
  python3 scripts/setup_agent_guidance.py
else
  echo "Skipping agent guidance setup (LINEAR_API_KEY not set)"
fi
```

This ensures guidance is always up-to-date after deployments.

---

## Next Steps

1. ✅ Run `python3 scripts/setup_agent_guidance.py`
2. ✅ Verify the key is working
3. ✅ Find an issue in "In Review" status
4. ✅ Assign to GitHub Copilot
5. ✅ Comment: `/qa`
6. ✅ Review the feedback
7. ✅ Comment: `/qa-approve`
8. ✅ Watch Copilot merge! 🎉

---

## Related Docs

- **QA Skill:** [`.agents/skills/qa/SKILL.md`](../.agents/skills/qa/SKILL.md) — Full QA workflow
- **Architecture:** [`docs/copilot-agent-automation-proposal.md`](copilot-agent-automation-proposal.md) — Design rationale
- **Manual Setup:** [`docs/copilot-agent-setup-quick-start.md`](copilot-agent-setup-quick-start.md) — If you prefer UI-based setup

---

**Questions?** Check the QA skill or the automation proposal doc.
