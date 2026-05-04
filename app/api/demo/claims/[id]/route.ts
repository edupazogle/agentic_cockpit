import { NextRequest, NextResponse } from 'next/server'
import { getClaim } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const claim = getClaim(id)
  if (!claim) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, ...claim })
}
