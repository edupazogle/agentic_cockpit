import type { ScenarioRecord } from '@/lib/domain/types'

export interface ScenarioRepository {
  listScenarios(): Promise<ScenarioRecord[]>
  getScenarioById(scenarioId: string): Promise<ScenarioRecord | null>
}
