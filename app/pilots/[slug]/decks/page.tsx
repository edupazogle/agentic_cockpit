import type { Metadata } from 'next'
import { Staircase } from '@/components/pilot/staircase'

interface DecksPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: DecksPageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: `Decks — ${slug} — GDAI Agentic Cockpit` }
}

export default async function DecksPage({ params }: DecksPageProps) {
  const { slug } = await params

  return (
    <div className="pilot-workspace">
      <Staircase currentLevel="L0" pilotSlug={slug} />

      <main className="centre-pane" style={{ maxWidth: 960, margin: '0 auto', padding: 40 }}>
        <h1>Generated Decks &amp; Memos</h1>
        <p>Steering-committee decks, compliance memos, and status updates for <strong>{slug}</strong>.</p>
        <div className="decks-placeholder">
          <p>Generated artifacts appear here after Movement IV (business case) and Movement VI (charter).</p>
        </div>
      </main>
    </div>
  )
}
