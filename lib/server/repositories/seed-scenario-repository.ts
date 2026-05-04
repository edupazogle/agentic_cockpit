import { getScenarioById, scenarioCatalog } from '@/lib/domain/scenario-catalog'
import type { ScenarioRecord } from '@/lib/domain/types'
import type { ScenarioRepository } from '@/lib/server/repositories/scenario-repository'

export class SeedScenarioRepository implements ScenarioRepository {
  async listScenarios(): Promise<ScenarioRecord[]> {
    return scenarioCatalog
  }

  async getScenarioById(scenarioId: string): Promise<ScenarioRecord | null> {
    return getScenarioById(scenarioId) ?? null
  }
}
