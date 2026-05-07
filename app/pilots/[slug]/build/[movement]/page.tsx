import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MovementCanvas } from '@/components/pilot/movement-canvas'
import { CompanionRail } from '@/components/pilot/companion-rail'
import { ConcernsPanel } from '@/components/pilot/concerns-panel'
import { Staircase } from '@/components/pilot/staircase'

const VALID_MOVEMENTS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii']

interface MovementPageProps {
  params: Promise<{ slug: string; movement: string }>
}

export async function generateMetadata({ params }: MovementPageProps): Promise<Metadata> {
  const { slug, movement } = await params
  return { title: `M${movement} — ${slug} — GDAI Agentic Cockpit` }
}

export default async function MovementPage({ params }: MovementPageProps) {
  const { slug, movement } = await params

  if (!VALID_MOVEMENTS.includes(movement)) {
    notFound()
  }

  return (
    <div className="pilot-workspace">
      <Staircase currentLevel="L0" pilotSlug={slug} />

      <div className="workspace-layout">
        <nav className="left-rail">
          <h3>Mouvements</h3>
          <ul className="movement-nav">
            {VALID_MOVEMENTS.map(m => (
              <li key={m}>
                <a
                  href={`/pilots/${slug}/build/${m}`}
                  className={m === movement ? 'active' : ''}
                >
                  {m.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
          <ConcernsPanel pilotSlug={slug} />
        </nav>

        <main className="centre-pane">
          <MovementCanvas movement={movement} pilotSlug={slug} />
        </main>

        <aside className="right-rail">
          <CompanionRail pilotSlug={slug} />
        </aside>
      </div>
    </div>
  )
}
