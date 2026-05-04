import { NextResponse } from 'next/server'

import { startScenarioRun } from '@/lib/server/services/runs'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ scenarioKey: string }> },
) {
  const { scenarioKey } = await params
  const requestPayload = await request
    .json()
    .catch(() => null) as Record<string, unknown> | null
  const requestUrl = new URL(request.url)
  const callbackBaseUrl =
    process.env.AGENTIC_CALLBACK_BASE_URL ||
    `${requestUrl.protocol}//${requestUrl.hostname === '0.0.0.0' ? '127.0.0.1' : requestUrl.hostname}${requestUrl.port ? `:${requestUrl.port}` : ''}`
  const run = await startScenarioRun(scenarioKey, {
    callbackBaseUrl,
    requestPayload: requestPayload ?? undefined,
  })

  if (!run) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  return NextResponse.json({ run }, { status: 201 })
}
