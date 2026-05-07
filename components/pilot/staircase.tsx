'use client'

const LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4'] as const

interface StaircaseProps {
  currentLevel: string
  pilotSlug: string
}

export function Staircase({ currentLevel, pilotSlug }: StaircaseProps) {
  const currentIdx = LEVELS.indexOf(currentLevel as typeof LEVELS[number])

  return (
    <nav className="staircase" aria-label="Pilot level">
      {LEVELS.map((level, i) => {
        const isCurrent = level === currentLevel
        const isPast = i < currentIdx
        const isFuture = i > currentIdx

        let className = 'step'
        if (isCurrent) className += ' current'
        if (isPast) className += ' past'
        if (isFuture) className += ' future'

        return (
          <a
            key={level}
            href={isFuture ? undefined : `/pilots/${pilotSlug}/${level === 'L0' ? 'build' : level === 'L1' ? 'test' : 'sandbox'}`}
            className={className}
            aria-current={isCurrent ? 'step' : undefined}
            title={isFuture ? `${level} — not yet available` : level}
          >
            <span className="step-dot" />
            <span className="step-label">{level}</span>
          </a>
        )
      })}
    </nav>
  )
}
