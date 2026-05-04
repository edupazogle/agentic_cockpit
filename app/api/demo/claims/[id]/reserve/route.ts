import { NextRequest, NextResponse } from 'next/server'
import { setReserve } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const claim = setReserve(id, Number(body.amount_eur) || 0, body.rationale || '')
  if (!claim) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({
    ok: true,
    claim_id: id,
    reserve_eur: claim.reserve_eur,
    reserve_rationale: claim.reserve_rationale,
  })
}
