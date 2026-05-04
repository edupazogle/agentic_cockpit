#!/usr/bin/env python3
"""
Linear Agent Guidance Setup Script

Automatically sets up GitHub Copilot Agent guidance via Linear GraphQL API.
Uses the LINEAR_API_KEY from .env.local (will prompt to add if missing)

Usage:
    python3 scripts/setup_agent_guidance.py
"""

import os
import sys
import json
from pathlib import Path
import subprocess
import webbrowser

# Read .env.local
def load_env():
    env_path = Path('.env.local')
    if not env_path.exists():
        print("❌ .env.local not found")
        sys.exit(1)
    
    env = {}
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, val = line.split('=', 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

def add_to_env(api_key):
    """Add LINEAR_API_KEY to .env.local"""
    env_path = Path('.env.local')
    
    with open(env_path, 'a') as f:
        f.write(f"\n# Linear API for agent setup (added by setup_agent_guidance.py)\nLINEAR_API_KEY={api_key}\n")
    
    print(f"✅ Added LINEAR_API_KEY to .env.local")

# GraphQL mutation to update workspace guidance
AGENT_GUIDANCE = """# GitHub Copilot QA Agent

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

## Team Conventions

- Branch naming: `<team>/<issue-id>-<slug>`
- PR title must include issue ID
- All merges to main must have passing CI
"""

WORKSPACE_MUTATION = """
mutation UpdateWorkspaceAgentGuidance($guidance: String!) {
  workspaceUpdate(input: {agentGuidance: $guidance}) {
    workspace {
      id
      name
      agentGuidance
    }
  }
}
"""

TEAM_MUTATION = """
query SearchTeams($first: Int) {
  teams(first: $first) {
    edges {
      node {
        id
        name
        agentGuidance
      }
    }
  }
}
"""

def run_graphql(api_key, query, variables=None):
    """Execute a GraphQL query against Linear API"""
    url = "https://api.linear.app/graphql"
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": query,
        "variables": variables or {}
    }
    
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", url,
             "-H", f"Authorization: {api_key}",
             "-H", "Content-Type: application/json",
             "-d", json.dumps(payload)],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            print(f"❌ curl failed: {result.stderr}")
            return None
        
        response = json.loads(result.stdout)
        
        if "errors" in response:
            print(f"❌ GraphQL error: {response['errors']}")
            return None
        
        return response.get("data")
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None

def setup_workspace_guidance(api_key):
    """Set workspace-level agent guidance"""
    print("\n🔧 Setting workspace-level agent guidance...")
    
    result = run_graphql(api_key, WORKSPACE_MUTATION, {
        "guidance": AGENT_GUIDANCE
    })
    
    if result and "workspaceUpdate" in result:
        workspace = result["workspaceUpdate"]["workspace"]
        print(f"✅ Updated workspace: {workspace['name']}")
        print(f"✅ Guidance set ({len(workspace['agentGuidance'])} chars)")
        return True
    else:
        print("⚠️  Could not set workspace guidance (may require admin)")
        return False

def list_teams(api_key):
    """List all teams to show guidance can be set per-team"""
    print("\n📋 Available teams:")
    
    result = run_graphql(api_key, TEAM_MUTATION, {"first": 50})
    
    if result and "teams" in result:
        for edge in result["teams"]["edges"]:
            team = edge["node"]
            print(f"  • {team['name']} (ID: {team['id']})")
            if team.get('agentGuidance'):
                print(f"    └─ Already has guidance set")
        return True
    return False

def main():
    print("=" * 60)
    print("LINEAR AGENT GUIDANCE SETUP")
    print("=" * 60)
    
    # Load environment
    print("\n📂 Loading .env.local...")
    env = load_env()
    
    # Check for LINEAR_API_KEY
    api_key = env.get("LINEAR_API_KEY")
    
    if not api_key:
        print("\n❌ LINEAR_API_KEY not found in .env.local")
        print("\n" + "=" * 60)
        print("HOW TO GET YOUR LINEAR API KEY")
        print("=" * 60)
        print("""
1. Go to Linear workspace settings:
   https://linear.app/settings/api
   
2. Click "Create new API key"

3. Give it a name: "Agentic Agent Setup"

4. Scopes needed: 
   ✓ admin (or: teams.write + workspace.write)

5. Copy the API key (you won't see it again!)

6. Paste it below:
        """)
        
        api_key = input("Enter your LINEAR_API_KEY: ").strip()
        
        if not api_key:
            print("❌ No API key provided")
            sys.exit(1)
        
        # Verify it's valid
        print("\n🔍 Verifying API key...")
        result = run_graphql(api_key, "query { viewer { id email } }")
        
        if not result or "viewer" not in result:
            print("❌ API key is invalid or has insufficient permissions")
            sys.exit(1)
        
        print(f"✅ API key valid (logged in as: {result['viewer']['email']})")
        
        # Ask to save
        save = input("\n💾 Save API key to .env.local? (y/N): ").strip().lower()
        if save == 'y':
            add_to_env(api_key)
        else:
            print("ℹ️  You'll need to provide the API key each time you run this script")
    else:
        print(f"✅ Found LINEAR_API_KEY in .env.local")
    
    # List teams
    print("\n📋 Available teams:")
    list_teams(api_key)
    
    # Set workspace guidance
    success = setup_workspace_guidance(api_key)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ SETUP COMPLETE")
        print("=" * 60)
        print("""
Next steps:
1. Go to Linear workspace: https://linear.app/
2. Find an issue in 'In Review' status
3. Assign it to 'GitHub Copilot' agent (in assignee dropdown)
4. Copilot will automatically:
   • Run /qa <issue-id> to trigger full QA review
   • Post structured feedback with 4 checklists
   • Wait for your approval
5. Comment: /qa-approve
6. Copilot merges the branch and transitions to Done! ✅

Questions?
  • Check docs/copilot-agent-automation-proposal.md
  • Or read the QA skill: .agents/skills/qa/SKILL.md
        """)
    else:
        print("\n⚠️  PARTIAL SETUP")
        print("""
Workspace guidance could not be set via API.
This may require workspace admin permissions.

Please set guidance manually:
  1. Go to: https://linear.app/settings/integrations/agents
  2. Or: Settings > Agents > Additional guidance  
  3. Paste the guidance text from:
     docs/copilot-agent-setup-quick-start.md (lines 31-60)
  4. Save

Then come back here to test!
        """)
    print()

if __name__ == "__main__":
    main()
