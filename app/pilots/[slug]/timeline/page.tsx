import type { Metadata } from 'next'
import { Staircase } from '@/components/pilot/staircase'

interface TimelinePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TimelinePageProps): Promise<Metadata> {
  const { slug } = await params
  return { title: `Timeline — ${slug} — GDAI Agentic Cockpit` }
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { slug } = await params

  return (
    <div className="pilot-workspace">
      <Staircase currentLevel="L0" pilotSlug={slug} />

      <main className="centre-pane" style={{ maxWidth: 960, margin: '0 auto', padding: 40 }}>
        <h1>Audit Timeline</h1>
        <p>Cross-level audit trail for pilot <strong>{slug}</strong>.</p>
        <div className="timeline-placeholder">
          <p>Ship events, level promotions, concern resolutions, and compaction memos appear here.</p>
        </div>
      </main>
    </div>
  )
}
