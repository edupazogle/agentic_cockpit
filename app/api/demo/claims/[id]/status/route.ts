import { NextRequest, NextResponse } from 'next/server'
import { updateClaimStatus } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const claim = updateClaimStatus(id, body.status || 'UPDATED', body.reason || '')
  if (!claim) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, claim_id: id, status: claim.status })
}
