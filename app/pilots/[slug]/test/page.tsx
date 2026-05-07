import type { Metadata } from 'next'
import { CompanionRail } from '@/components/pilot/companion-rail'
import { Staircase } from '@/components/pilot/staircase'

interface TestPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TestPageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: `L1 Test — ${slug} — GDAI Agentic Cockpit` }
}

export default async function TestPage({ params }: TestPageProps) {
  const { slug } = await params

  return (
    <div className="pilot-workspace">
      <Staircase currentLevel="L1" pilotSlug={slug} />

      <div className="workspace-layout">
        <nav className="left-rail">
          <h3>L1 · Solo Test</h3>
          <div className="module-selector">
            <p className="empty-hint">Modules appear here after ship.</p>
          </div>
        </nav>

        <main className="centre-pane">
          <div className="l1-hero">
            <p className="eyebrow">YOUR PILOT IS LIVE AT L1 · v0.4.2</p>
            <h1>Call your pilot — it&apos;s listening.</h1>
            <ol className="l1-steps">
              <li>Dial the DNIS number for your module.</li>
              <li>Say the voucher code when prompted.</li>
              <li>Describe a fictional case — the agent handles the rest.</li>
            </ol>
          </div>

          <div className="l1-module-card">
            <h3>No modules shipped yet</h3>
            <p>Complete L0 movements and press ship to see your module here.</p>
          </div>

          <details className="l1-scenarios">
            <summary>3 first-call scenarios I&apos;d recommend ↓</summary>
            <p>Scenarios appear after your first ship. The Compagnon drafts them at Movement VIII.</p>
          </details>
        </main>

        <aside className="right-rail">
          <CompanionRail pilotSlug={slug} />
        </aside>
      </div>
    </div>
  )
}
