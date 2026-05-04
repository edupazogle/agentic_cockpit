import { NextResponse } from 'next/server'

import { listScenarios } from '@/lib/server/services/scenarios'

export const dynamic = 'force-dynamic'

export async function GET() {
  const scenarios = await listScenarios()
  return NextResponse.json({ scenarios })
}
