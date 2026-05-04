import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/server/demo/synthetic-db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, ...reverseGeocode(Number(body.lat) || 0, Number(body.lon) || 0) })
}
