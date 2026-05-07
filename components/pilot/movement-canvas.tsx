'use client'

interface MovementCanvasProps {
  movement: string
  pilotSlug: string
}

const MOVEMENT_NAMES: Record<string, string> = {
  i: 'Personas & parcours',
  ii: 'Recherche / réalité',
  iii: 'Plan & portes HITL',
  iv: 'Business case',
  v: 'Synth seed',
  vi: 'Charte',
  vii: 'Répétition',
  viii: 'Synthèse',
}

export function MovementCanvas({ movement, pilotSlug }: MovementCanvasProps) {
  const name = MOVEMENT_NAMES[movement] || `Mouvement ${movement}`

  return (
    <div className="movement-canvas">
      <div className="movement-header">
        <h2>Mouvement {movement.toUpperCase()} — {name}</h2>
        <span className="pilot-slug">{pilotSlug}</span>
      </div>

      <div className="movement-body">
        <div className="movement-pane">
          <p className="pane-placeholder">
            Centre pane for movement {movement}. The Compagnon populates this
            with artifacts, diffs, and interactive controls as the conversation
            progresses.
          </p>
        </div>

        <aside className="movement-tools">
          <h4>Outils disponibles</h4>
          <ul>
            {movement === 'i' && (
              <>
                <li>parse_document</li>
                <li>propose_persona</li>
                <li>eval_exit_criteria</li>
              </>
            )}
            {movement === 'ii' && (
              <>
                <li>search_regulatory_corpus</li>
                <li>web_search_insurance</li>
                <li>eval_exit_criteria</li>
              </>
            )}
            {movement === 'iii' && (
              <>
                <li>propose_flow_topology</li>
                <li>propose_module_spec</li>
                <li>run_lint</li>
              </>
            )}
            {movement === 'viii' && (
              <>
                <li>run_lint (full)</li>
                <li>generate_artifacts</li>
                <li>eval_exit_criteria</li>
              </>
            )}
          </ul>
        </aside>
      </div>
    </div>
  )
}
