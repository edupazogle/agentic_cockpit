export function isPilotWorkspaceV2Enabled(): boolean {
  if (process.env.NEXT_PUBLIC_PILOT_WORKSPACE_V2 === '1') return true
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pilot-workspace-v2') === '1'
  }
  return false
}
