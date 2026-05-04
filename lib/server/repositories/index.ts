import type { ScenarioRepository } from '@/lib/server/repositories/scenario-repository'
import { SeedScenarioRepository } from '@/lib/server/repositories/seed-scenario-repository'
import { SupabaseScenarioRepository } from '@/lib/server/repositories/supabase-scenario-repository'
import { hasSupabaseConfig } from '@/lib/server/integrations/supabase'

export function getScenarioRepository(): ScenarioRepository {
  if (process.env.AGENTIC_REPOSITORY_MODE === 'seed') {
    return new SeedScenarioRepository()
  }

  if (hasSupabaseConfig()) {
    return new SupabaseScenarioRepository()
  }

  return new SeedScenarioRepository()
}
