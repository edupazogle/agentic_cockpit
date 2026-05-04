import { createRun, getRun, getRunSnapshot, ingestRunCallback } from '@/lib/server/runtime/run-store'
import { getScenario } from '@/lib/server/services/scenarios'

export async function startScenarioRun(
  scenarioId: string,
  options: { callbackBaseUrl: string; requestPayload?: Record<string, unknown> },
) {
  const scenario = await getScenario(scenarioId)

  if (!scenario) {
    return null
  }

  return createRun(scenario, options)
}

export async function getScenarioRun(runId: string) {
  return getRun(runId)
}

export async function getScenarioRunSnapshot(runId: string) {
  return getRunSnapshot(runId)
}

export async function applyN8nCallback(
  callback: Parameters<typeof ingestRunCallback>[0],
  statusOverride?: Parameters<typeof ingestRunCallback>[1],
) {
  return ingestRunCallback(callback, statusOverride)
}
