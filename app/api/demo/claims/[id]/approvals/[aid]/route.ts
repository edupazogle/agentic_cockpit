import { NextRequest, NextResponse } from 'next/server'
import { decideApproval } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string; aid: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, aid } = await params
  const body = await req.json().catch(() => ({}))
  const approval = decideApproval(id, aid, body.decision || 'approved', body.rationale)
  if (!approval) {
    return NextResponse.json({ ok: false, error: 'approval not found' }, { status: 404 })
  }
  return NextResponse.json({
    ok: true,
    approval_id: approval.id,
    decision: approval.decision,
    decided_at: approval.decided_at,
  })
}
