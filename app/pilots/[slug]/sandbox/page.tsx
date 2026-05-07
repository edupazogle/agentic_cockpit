import type { Metadata } from 'next'
import { CompanionRail } from '@/components/pilot/companion-rail'
import { Staircase } from '@/components/pilot/staircase'

interface SandboxPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SandboxPageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: `L2 Sandbox — ${slug} — GDAI Agentic Cockpit` }
}

export default async function SandboxPage({ params }: SandboxPageProps) {
  const { slug } = await params

  return (
    <div className="pilot-workspace">
      <Staircase currentLevel="L2" pilotSlug={slug} />

      <div className="workspace-layout">
        <nav className="left-rail">
          <h3>L2 · Sandbox Load</h3>
          <p className="empty-hint">Cohort runner — architectural sketch.</p>
        </nav>

        <main className="centre-pane">
          <div className="l2-shell">
            <h1>L2 Sandbox — Architectural Sketch</h1>
            <p>Full sandbox-load UI deferred to a later sprint.</p>

            <div className="l2-panels">
              {['Cohort Run Controller', 'Live Throughput', 'Gate Trigger Heat-Map',
                'Latency Distribution', 'Drift Detector', 'Comparative Analysis',
              ].map(name => (
                <div key={name} className="l2-panel-stub">
                  <h4>{name}</h4>
                  <p className="stub-note">Stub — deferred</p>
                </div>
              ))}
            </div>

            <div className="cohort-runner-stub">
              <button disabled>Cohort runner stub — post to stub endpoint</button>
            </div>
          </div>
        </main>

        <aside className="right-rail">
          <CompanionRail pilotSlug={slug} />
        </aside>
      </div>
    </div>
  )
}
