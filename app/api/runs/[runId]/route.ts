import { NextResponse } from 'next/server'

import { getScenarioRun } from '@/lib/server/services/runs'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params
  const run = await getScenarioRun(runId)

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  return NextResponse.json({ run })
}
