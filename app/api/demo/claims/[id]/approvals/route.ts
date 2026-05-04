import { NextRequest, NextResponse } from 'next/server'
import { createApproval } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const approval = createApproval(id, {
    gate: body.gate || 'approval',
    payload: body.payload || {},
  })
  if (!approval) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({
    ok: true,
    approval_id: approval.id,
    id: approval.id,
    gate: approval.gate,
    decision: approval.decision,
    created_at: approval.created_at,
  })
}
