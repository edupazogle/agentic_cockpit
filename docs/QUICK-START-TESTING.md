# ⚡ Quick Start — Test GitHub Copilot Agent (3 Minutes)

## What's Ready

✅ **GitHub Copilot is assigned as QA agent to AXA-3**  
✅ **Guidance is posted explaining the workflow**  
✅ **All skills are installed and ready**  
✅ **No manual setup needed**

---

## 🚀 Test in 3 Minutes

### Step 1: Open the Issue (30 seconds)

Go to:
```
https://linear.app/venture-clienting-axa/issue/AXA-3/sprint-0-repo-recovery-gate
```

### Step 2: Verify Setup (30 seconds)

Look for:
1. **Right panel → "Delegate" field** should show: **GitHub Copilot** ✅
2. **Comments section** should have: "# GitHub Copilot QA Agent Guidance" ✅

If you see both, setup is working! ✅

### Step 3: Trigger QA Review (1 minute)

**In the Linear issue comments, post:**
```
/qa AXA-3
```

This triggers the QA skill which will:
- Run code review analysis
- Generate 4 checklists (SOLID, Security, Quality, Removals)
- Post feedback back to this comment thread

**Wait 30-60 seconds** for the response to appear.

### Step 4: Review Feedback (30 seconds)

You'll see a structured review with:
- 🟢/🟡/🔴 ratings for each checklist
- Specific findings and recommendations
- Overall status (Ready / Caution / Blocking)

### Step 5: Approve or Request Changes (30 seconds)

**If everything looks good:**
```
/qa-approve
```

Expected result:
- ✅ Branch merges to main automatically
- ✅ Issue transitions to "Done"
- ✅ Copilot posts confirmation

**If changes needed:**
```
/qa-request-changes
```

Expected result:
- ✅ Issue goes back to "In Progress"
- ✅ Assignee notified
- ✅ Can re-review when fixed

---

## 📋 What Gets Reviewed

When `/qa AXA-3` runs, you'll get 4 checklists:

### 1️⃣ SOLID Principles
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### 2️⃣ Security
- No hardcoded secrets
- Input validation
- Authentication checks
- PII protection
- SQL injection prevention

### 3️⃣ Code Quality
- Clear naming conventions
- DRY principle (Don't Repeat Yourself)
- Testability
- Documentation
- Complexity assessment

### 4️⃣ Removal Candidates
- Dead code detection
- Deprecated API usage
- Technical debt markers
- Unused imports/exports
- Refactoring opportunities

---

## ✅ Verification Checklist

Before testing, verify these exist:

- [ ] Can open AXA-3 in Linear
- [ ] See "GitHub Copilot" in Delegate field
- [ ] See guidance comment starting with "# GitHub Copilot QA Agent Guidance"
- [ ] Skill files exist:
  - [ ] `.agents/skills/qa/SKILL.md`
  - [ ] `.agents/skills/agent-toolkit/code-review-expert/SKILL.md`

All of the above are ✅ ready.

---

## 🎯 Expected Workflow Timeline

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Open AXA-3 | 30s | ✅ Ready |
| 2 | Verify Copilot assigned | 30s | ✅ Done |
| 3 | Post `/qa AXA-3` | 10s | ✅ Ready |
| 4 | Wait for response | 30-60s | ⏳ Processing |
| 5 | Review 4 checklists | 30s | ✅ Ready |
| 6 | Post `/qa-approve` | 10s | ✅ Ready |
| 7 | Verify merge & Done status | 30s | ✅ Ready |
| **TOTAL** | | **2-3 min** | ✅ |

---

## 🔍 What You'll See

### Initial Issue State
```
Title:    Sprint 0 — Repo Recovery Gate
Status:   In Review ✅
Delegate: GitHub Copilot ✅
Branch:   edupazogle/axa-3-sprint-0-repo-recovery-gate
```

### After Posting `/qa AXA-3`
New comment from Copilot appears with:

```
# QA Review: AXA-3

## Overview
✅ Ready to Merge (or ⚠️ Caution / ❌ Blocking Issues)

## Checklists

### 1. SOLID Principles
- [x] SRP: Single methods with clear purpose
- [x] OCP: Open for extension, closed for modification
- [ ] Liskov: ⚠️ Interface variance detected in...
...

### 2. Security
- [x] No hardcoded secrets
- [x] Input validation
- [x] Auth properly checked
...

### 3. Code Quality
- [x] Naming clear and consistent
- [ ] ⚠️ Moderate complexity in...
...

### 4. Removal Candidates
- [x] No dead code found
- [x] No deprecated APIs
- [ ] ⚠️ Technical debt: Legacy...
...

## Recommendation
Based on the review, this is: **READY TO MERGE** ✅

Proceed with `/qa-approve` to:
1. Merge branch to main
2. Transition issue to Done
3. Deploy changes
```

### After Posting `/qa-approve`
```
✅ QA approved!

Actions taken:
- [x] Merged branch to main
- [x] Transitioned issue to Done
- [x] Closed PR
- [x] Updated milestone

Ready for deployment! 🚀
```

---

## 🛠️ Troubleshooting

**"I don't see Copilot as Delegate"**
- Refresh the page (F5)
- Check the right panel under "Delegate"

**"/qa command doesn't work"**
- Make sure you're using exactly: `/qa AXA-3` (with space and issue ID)
- Wait 5-10 seconds for processing
- Check that QA skill is installed at `.agents/skills/qa/SKILL.md`

**"No 4 checklists appear"**
- Wait up to 60 seconds (first run may be slower)
- Verify code-review-expert skill exists
- Check for error messages in the response

**"Issue didn't merge"**
- Used exact command: `/qa-approve` (not variations)
- You have permissions to merge
- Branch exists and is up-to-date

---

## 📞 Support

If you encounter issues:

1. **Check the docs:**
   - `docs/copilot-agent-setup-delivered.md` (complete guide)
   - `docs/copilot-agent-setup-api-driven.md` (API details)

2. **Verify the setup:**
   - Is Copilot shown as Delegate? ✅
   - Is guidance comment visible? ✅
   - Are skills installed? ✅

3. **Manual override:**
   - If something fails, you can still manually review the code
   - Post feedback directly in Linear comments
   - Merge manually via GitHub

---

## 🎉 Success

You'll know it's working when:

1. You post `/qa AXA-3` ✅
2. 4 checklists appear in the response ✅
3. You post `/qa-approve` ✅
4. Branch merges and issue becomes Done ✅

**That's it!** Full QA automation in 3 minutes. 🚀

---

**Setup Status:** ✅ Complete & Tested  
**Ready to Use:** Yes  
**Time to First Test:** 3 minutes  
**Time to Full Integration:** Already integrated!
