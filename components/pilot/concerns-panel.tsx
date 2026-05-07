'use client'

import { useEffect, useState } from 'react'

interface Concern {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body?: string
  status: 'open' | 'acked' | 'resolved'
}

interface ConcernsPanelProps {
  pilotSlug: string
}

export function ConcernsPanel({ pilotSlug }: ConcernsPanelProps) {
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/pilots/${pilotSlug}/concerns`)
      .then(r => r.json())
      .then(d => setConcerns(d.concerns || []))
      .catch(() => {})
  }, [pilotSlug])

  const criticals = concerns.filter(c => c.severity === 'critical' && c.status === 'open')
  const warnings = concerns.filter(c => c.severity === 'warning' && c.status === 'open')

  return (
    <div className="concerns-panel">
      <button className="concerns-toggle" onClick={() => setOpen(!open)}>
        {criticals.length > 0 && <span className="badge critical">{criticals.length}</span>}
        {warnings.length > 0 && <span className="badge warning">{warnings.length}</span>}
        Préoccupations {open ? '▲' : '▼'}
      </button>

      {open && (
        <ul className="concerns-list">
          {concerns.filter(c => c.status === 'open').map(c => (
            <li key={c.id} className={`concern concern-${c.severity}`}>
              <strong>{c.title}</strong>
              {c.body && <p>{c.body}</p>}
            </li>
          ))}
          {concerns.filter(c => c.status === 'open').length === 0 && (
            <li className="concern-empty">Aucune préoccupation ouverte.</li>
          )}
        </ul>
      )}
    </div>
  )
}
