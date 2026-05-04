import Link from 'next/link'
import { ArrowUpRight, MoreHorizontal } from 'lucide-react'

import type { ScenarioRecord } from '@/lib/domain/types'
import { IconGlyph } from '@/components/shared/icon-glyph'

interface ScenarioCardProps {
  scenario: ScenarioRecord
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <article className="project-card">
      <Link className="project-card-link" href={`/scenario/${scenario.id}`}>
        <span className="sr-only">Open {scenario.title}</span>
      </Link>
      <div className="project-card-header">
        <div>
          <div className="project-card-title">{scenario.title}</div>
          <div className="project-card-subtitle">{scenario.updatedLabel}</div>
        </div>
        <button className="ghost-icon-button" type="button" aria-label={`Scenario menu for ${scenario.title}`}>
          <MoreHorizontal size={15} />
        </button>
      </div>
      <div className="project-card-preview">
        <div className="project-card-preview-grid">
          {scenario.previewServices.map((service) => (
            <div key={service.id} className={`preview-square preview-square--${service.accent}`} title={service.label}>
              <IconGlyph icon={service.icon} className="preview-square-icon" />
            </div>
          ))}
        </div>
        <div className="project-card-facts">
          <span>{scenario.agents} agents</span>
          <span>{scenario.mcps} MCPs</span>
          <span>{scenario.workflows} flows</span>
        </div>
      </div>
      <div className="project-card-footer">
        <div className="online-indicator" aria-hidden="true" />
        <span>{scenario.environment}</span>
        <span>·</span>
        <span>
          {scenario.servicesOnline}/{scenario.totalServices} services online
        </span>
        <span className={`status-pill status-pill--${scenario.status}`}>{scenario.status}</span>
        <ArrowUpRight className="project-card-arrow" size={14} />
      </div>
    </article>
  )
}
