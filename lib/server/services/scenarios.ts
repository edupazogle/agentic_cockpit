import type { ScenarioRecord } from '@/lib/domain/types'
import { getScenarioRepository } from '@/lib/server/repositories'
import { SeedScenarioRepository } from '@/lib/server/repositories/seed-scenario-repository'
import { SupabaseConnectivityError } from '@/lib/server/integrations/supabase'

function shouldFallbackToSeed(error: unknown) {
  if (error instanceof SupabaseConnectivityError) {
    return true
  }

  const maybeError = error as { message?: string; cause?: { code?: string } } | undefined
  const code = maybeError?.cause?.code
  const message = maybeError?.message || ''

  return code === 'ENOTFOUND' || message.includes('fetch failed')
}

export async function listScenarios(): Promise<ScenarioRecord[]> {
  const repository = getScenarioRepository()

  try {
    return await repository.listScenarios()
  } catch (error) {
    if (!shouldFallbackToSeed(error)) {
      throw error
    }

    console.warn('Supabase is unreachable. Falling back to seed scenarios.')
    return new SeedScenarioRepository().listScenarios()
  }
}

export async function getScenario(scenarioId: string): Promise<ScenarioRecord | null> {
  const repository = getScenarioRepository()

  try {
    return await repository.getScenarioById(scenarioId)
  } catch (error) {
    if (!shouldFallbackToSeed(error)) {
      throw error
    }

    console.warn('Supabase is unreachable. Falling back to seed scenario lookup.')
    return new SeedScenarioRepository().getScenarioById(scenarioId)
  }
}
