import {
  Bell,
  ChevronDown,
  Grid2x2,
  LayoutTemplate,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { ScenarioCard } from '@/components/dashboard/scenario-card'
import type { ScenarioRecord } from '@/lib/domain/types'

const navItems = [
  { label: 'Projects', icon: Grid2x2, active: true },
  { label: 'Templates', icon: LayoutTemplate },
  { label: 'People', icon: Users },
  { label: 'Settings', icon: Settings },
]

interface DashboardPageProps {
  scenarios: ScenarioRecord[]
}

export function DashboardPage({ scenarios }: DashboardPageProps) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="railway-mark">R</div>
        <button className="workspace-switcher" type="button">
          <span className="workspace-switcher-avatar">M</span>
          <span className="workspace-switcher-copy">
            <span className="workspace-switcher-label">Mr E&apos;s Projects</span>
            <span className="workspace-switcher-meta">External Supabase workspace</span>
          </span>
          <ChevronDown size={15} />
        </button>
        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`sidebar-nav-item ${item.active ? 'is-active' : ''}`}
              type="button"
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="workspace-switcher workspace-switcher--footer">
            <span className="workspace-switcher-avatar">E</span>
            <span className="workspace-switcher-copy">
              <span className="workspace-switcher-label">agentic-web</span>
              <span className="workspace-switcher-meta">App-owned control plane</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-title">
            <span className="dashboard-topbar-eyebrow">Workspace</span>
            <h1>Scenarios</h1>
          </div>
          <div className="dashboard-topbar-actions">
            <button className="ghost-icon-button" type="button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button className="primary-button" type="button">
              <Plus size={15} />
              <span>New</span>
            </button>
          </div>
        </header>

        <main className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div className="dashboard-panel-copy">
              <div className="dashboard-panel-count">{scenarios.length} scenarios</div>
              <p>
                Railway-inspired control plane backed by internal APIs. Scenario topology comes from your
                configured Supabase project, while the app owns the UI and runtime contract.
              </p>
            </div>
            <div className="dashboard-toolbar">
              <button className="toolbar-pill toolbar-pill--active" type="button">
                <Grid2x2 size={14} />
                <span>Grid</span>
              </button>
              <button className="toolbar-pill" type="button">
                External Supabase
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <section className="scenario-grid" aria-label="Scenario list">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </section>

          <section className="dashboard-callout">
            <div>
              <div className="dashboard-callout-eyebrow">Architecture</div>
              <h2>Supabase is configured, not embedded</h2>
              <p>
                This starter no longer assumes a self-hosted Supabase service. Point `agentic-web` at your
                existing project with environment variables and keep all scenario rendering behind the app API.
              </p>
            </div>
            <Link className="secondary-button" href={scenarios[0] ? `/scenario/${scenarios[0].id}` : '/'}>
              Open flagship scenario
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}
