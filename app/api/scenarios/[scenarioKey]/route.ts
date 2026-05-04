import { NextResponse } from 'next/server'

import { getScenario } from '@/lib/server/services/scenarios'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scenarioKey: string }> },
) {
  const { scenarioKey } = await params
  const scenario = await getScenario(scenarioKey)

  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  return NextResponse.json({ scenario })
}
