import { NextRequest, NextResponse } from 'next/server'
import { createEscalation } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const escalation = createEscalation(id, {
    reason: body.reason || '',
    summary: body.summary || '',
  })
  if (!escalation) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, escalation_id: escalation.id, ...escalation })
}
