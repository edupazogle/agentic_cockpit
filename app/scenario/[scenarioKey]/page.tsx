import { notFound } from 'next/navigation'

import { ScenarioWorkspace } from '@/components/scenario/scenario-workspace'
import { getScenario } from '@/lib/server/services/scenarios'

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ scenarioKey: string }>
}) {
  const { scenarioKey } = await params
  const scenario = await getScenario(scenarioKey)

  if (!scenario) {
    notFound()
  }

  return <ScenarioWorkspace scenario={scenario} />
}
