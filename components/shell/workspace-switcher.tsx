'use client'

/** WorkspaceSwitcher — single-tenant MVP shows gdai-default only. */
export function WorkspaceSwitcher() {
  return (
    <div className="workspace-switcher" aria-label="Current workspace">
      <span className="workspace-switcher__badge">gdai-default</span>
    </div>
  )
}
