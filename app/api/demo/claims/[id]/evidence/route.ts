import { NextRequest, NextResponse } from 'next/server'
import { addEvidence } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const ev = addEvidence(id, {
    kind: body.kind || 'document',
    uri: body.uri || '',
    meta: body.meta || {},
  })
  if (!ev) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, evidence_id: ev.id, ...ev })
}
