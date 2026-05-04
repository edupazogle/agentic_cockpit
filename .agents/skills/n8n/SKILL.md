---
name: n8n
description: "n8n workflow automation and MCP tools layer. Use when building, editing, validating, or debugging n8n workflows, writing Code nodes, configuring MCP tools, or designing workflow patterns. Triggers: /n8n, n8n, workflow, MCP tool, code node, automation"
---

# n8n Hub

IRON LAW: Always validate a workflow before deploying. Never guess node parameter names — use `get_node_types` to get exact TypeScript definitions first.

## Sub-Skill Catalog

| User says... | Load sub-skill |
|---|---|
| "write JavaScript in n8n", "Code node JS", "$input", "$json", "data transformation" | `n8n-code-javascript/SKILL.md` |
| "write Python in n8n", "Code node Python", "pandas in n8n" | `n8n-code-python/SKILL.md` |
| "n8n expression", "{{ }} syntax", "expression error", "template" | `n8n-expression-syntax/SKILL.md` |
| "build MCP tool", "author MCP tool", "tool wiring", "wfmcp" | `n8n-mcp-tools-expert/SKILL.md` |
| "configure node", "node settings", "node parameters", "HTTP Request" | `n8n-node-configuration/SKILL.md` |
| "validate workflow", "workflow errors", "pre-deploy check" | `n8n-validation-expert/SKILL.md` |
| "workflow pattern", "retry logic", "error branch", "sub-workflow", "SplitInBatches" | `n8n-workflow-patterns/SKILL.md` |

## Decision Tree

1. Writing **JavaScript** in a Code node? → `n8n-code-javascript/SKILL.md`
2. Writing **Python** in a Code node? → `n8n-code-python/SKILL.md`
3. Using n8n **expressions** (`{{ }}`)? → `n8n-expression-syntax/SKILL.md`
4. **Building/authoring MCP tools**? → `n8n-mcp-tools-expert/SKILL.md`
5. **Configuring built-in nodes**? → `n8n-node-configuration/SKILL.md`
6. **Validating workflows** before deploy? → `n8n-validation-expert/SKILL.md`
7. **Designing workflow patterns** (retries, errors, sub-flows)? → `n8n-workflow-patterns/SKILL.md`

## Related Domains

Before executing, check if the task touches:
- **Database/persistence** → also load `../supabase/SKILL.md`
- **Langflow orchestration** → also load `../langflow/SKILL.md`
- **Deployment** → also load `../railway/SKILL.md`
- **Tracing/observability** → also load `../langfuse/SKILL.md`

## Anti-Patterns

- NEVER guess node parameter names — use `mcp__n8n-mcp__get_node` or `search_nodes` first
- NEVER deploy without `validate_workflow` passing
- NEVER hard-code credentials in workflow JSON
- NEVER skip error output configuration on HTTP Request nodes
- NEVER use Code node when a built-in node does the same thing

## Confirmation Gates

⛔ ASK before: deploying to production, modifying active workflows, deleting workflow data, credential changes
