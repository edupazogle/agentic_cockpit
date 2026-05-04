---
name: agent-toolkit
description: "Meta-toolkit for skill authoring, code review, architecture diagrams, and quality evaluation. Use when creating/improving skills, reviewing code quality, generating C4 or mermaid diagrams, or evaluating SKILL.md files. Triggers: /toolkit, skill, code review, diagram, architecture, evaluate"
---

# Agent Toolkit Hub

Meta-toolkit for improving the agent itself — skill creation, code review, architecture visualization, and quality evaluation.

## Sub-Skill Catalog

| User says... | Load sub-skill |
|---|---|
| "create a skill", "build a skill", "improve a skill", "package skill", "SKILL.md" | `skill-forge/SKILL.md` |
| "review this code", "code review", "SOLID checklist", "security audit" | `code-review-expert/SKILL.md` |
| "evaluate this skill", "score this skill", "audit this skill", "skill quality" | `skill-judge/SKILL.md` |
| "C4 diagram", "architecture diagram", "mermaid diagram" | `c4-architecture.md` or `mermaid-diagrams.md` |

## Decision Tree

1. **Creating/improving a skill**? → `skill-forge/SKILL.md`
2. **Evaluating a skill's quality**? → `skill-judge/SKILL.md`
3. **Reviewing production code**? → `code-review-expert/SKILL.md`
4. **Drawing architecture/diagrams**? → `c4-architecture.md` or `mermaid-diagrams.md`

## Related Domains

The toolkit is domain-agnostic — it can be used alongside any other hub. When doing a code review:
- Load the relevant domain hub (langflow, n8n, supabase) for domain-specific rules
- Then load code-review-expert for the review framework

## Anti-Patterns

- NEVER create a skill without running through skill-forge's full workflow
- NEVER give high review scores just because code "looks professional"
- NEVER skip the Iron Law when creating a skill

## Confirmation Gates

⛔ ASK before: packaging a skill, deleting code flagged as "removal candidate"
