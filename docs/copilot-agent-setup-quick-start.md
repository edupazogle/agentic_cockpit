# GitHub Copilot Agent Setup — Quick Start Guide

**Goal:** Set up GitHub Copilot Agent to automate QA reviews and merges  
**Time:** 15 minutes  
**Difficulty:** Easy

---

## Quick Summary

The GitHub Copilot agent is already in your Linear workspace (you can see it in the assignee dropdown). We'll:
1. Write **guidance** that tells it what to do
2. **Assign it to issues** in "In Review" status
3. It automatically runs your QA workflow

---

## Step 1: Write Agent Guidance (5 minutes)

1. Go to your Linear workspace
2. Click **Settings** (gear icon, bottom-left)
3. Click **Agents** (or search for "Agents")
4. Click **Additional guidance**
5. Paste this template:

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
- ✅ Never merge without explicit `/qa-approve` command from user
- ✅ If I find blockers, recommend `/qa-request-changes`
- ✅ Post clear, helpful comments
- ✅ If no response for 24h, post a reminder

## Example Workflow

```
Issue moves to "In Review"
    ↓
You assign to GitHub Copilot
    ↓
I run: /qa <issue-id>
    ↓
I post review with 4 checklists
    ↓
You review and post: "/qa-approve" comment
    ↓
I run: /qa-approve <issue-id>
    ↓
I post: "✅ Merge complete. Issue moved to Done."
```
```

6. Click **Save** (top-right of guidance editor)

✅ **Done!** Your agent now has instructions.

---

## Step 2: Test with an Issue (5 minutes)

Let's test with the next issue moving to "In Review":

1. Find an issue in "In Review" status (e.g., AXA-3)
2. Click the **Assignee** field (in Properties sidebar)
3. Search for "GitHub Copilot"
4. Click to assign

**What happens next:**
- GitHub Copilot receives notification
- It reads the guidance you just wrote
- It runs: `/qa <issue-id>` automatically
- It posts a review comment with 4 checklists

---

## Step 3: Approve the Merge (2 minutes)

After QA review is posted:

1. Read the review in the Linear issue comments
2. If it looks good, post a comment: `/qa-approve`
3. GitHub Copilot sees this and executes:
   - Merges the branch to main
   - Transitions issue to "Done"
   - Posts success confirmation

---

## What You'll See

### Before (Current)
```
Issue: AXA-3
Status: In Review
Assignee: Eduardo
Agent: (none)
```

### After (With Agent)
```
Issue: AXA-3
Status: In Review
Assignee: Eduardo
Agent: GitHub Copilot ← New!

Comments:
  [GitHub Copilot] ✅ QA Review — AXA-3
  
  🔒 SOLID Checklist: 5/5 pass ✅
  🛡️ Security Audit: 5/5 pass ✅
  📊 Code Quality: 5/5 pass ✅
  🗑️ Removal Candidates: 4/4 pass ✅
  
  Recommendation: 🟢 Ready to Merge
  
  [You reply with] /qa-approve
  
  [GitHub Copilot] ✅ Merge approved. Branch merged to main.
  Issue moved to Done.
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| GitHub Copilot doesn't appear in assignee dropdown | Agent might not be installed. Go to `Settings > Applications` and verify it's there. If missing, check Linear's apps marketplace. |
| Agent assigned but no action happens | 1) Verify guidance was saved. 2) Check issue is truly in "In Review". 3) Refresh the issue page. |
| Agent runs `/qa` but output is wrong | Check QA skill is working: run `/qa AXA-3` manually in Copilot CLI and verify output. |
| `/qa-approve` doesn't trigger merge | Make sure you post comment as `/qa-approve` (not `/qa-approve AXA-3`). The agent will infer the issue ID. |

---

## For Later: Auto-Assignment (Sprint 2)

Once you're happy with manual assignment, you can set up a rule so Copilot is **automatically assigned** when an issue moves to "In Review":

**How:**
1. Go to `Settings > [Your Team] > Workflow`
2. Look for "Automations" or "Rules"
3. Create rule: "When status → In Review, assign to GitHub Copilot"
4. Save

**Result:** Zero manual steps. Issues auto-assign Copilot when they enter "In Review".

---

## Next: Monitor Agent Activity

In Linear, you can track what Copilot does:

1. **Activity Feed:** View the issue's activity tab to see all agent actions
2. **My Issues:** See all delegated issues in your "My issues" view
3. **Insights:** (Business/Enterprise) Track how much work is delegated to agents

---

## Questions?

If something doesn't work as expected:
1. Check the guidance text (typos in `/qa` command?)
2. Verify issue status is exactly "In Review"
3. Look at the issue's activity feed for error messages
4. Try manually running `/qa <issue-id>` in Copilot CLI to verify the command works

---

**You're all set! Assign GitHub Copilot to your next "In Review" issue and watch the automation work.** 🎉
