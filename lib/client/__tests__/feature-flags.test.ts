import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isPilotWorkspaceV2Enabled } from '../feature-flags'

describe('isPilotWorkspaceV2Enabled', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('returns false when env flag is not set', () => {
    expect(isPilotWorkspaceV2Enabled()).toBe(false)
  })

  it('returns true when env flag is "1"', () => {
    vi.stubEnv('NEXT_PUBLIC_PILOT_WORKSPACE_V2', '1')
    expect(isPilotWorkspaceV2Enabled()).toBe(true)
  })

  it('returns true when localStorage override is "1"', () => {
    localStorage.setItem('pilot-workspace-v2', '1')
    expect(isPilotWorkspaceV2Enabled()).toBe(true)
  })
})
