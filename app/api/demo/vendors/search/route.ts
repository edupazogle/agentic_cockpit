import { NextRequest, NextResponse } from 'next/server'
import { searchVendors } from '@/lib/server/demo/synthetic-db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ ok: true, ...searchVendors(body) })
}
