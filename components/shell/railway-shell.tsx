import type { ReactNode } from 'react'
import { SidebarNav } from './sidebar-nav'
import { WorkspaceSwitcher } from './workspace-switcher'

interface RailwayShellProps {
  children: ReactNode
}

/**
 * RailwayShell — the outer chrome of the cockpit.
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │ header (wordmark + workspace)        │
 *   ├────────┬─────────────────────────────┤
 *   │sidebar │ main content area           │
 *   └────────┴─────────────────────────────┘
 */
export function RailwayShell({ children }: RailwayShellProps) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="railway-shell">
        <header className="railway-shell__header" role="banner">
          <span className="railway-shell__wordmark">GDAI</span>
          <WorkspaceSwitcher />
        </header>
        <div className="railway-shell__body">
          <SidebarNav />
          <main id="main-content" className="railway-shell__main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
