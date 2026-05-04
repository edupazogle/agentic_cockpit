import { NextRequest, NextResponse } from 'next/server'
import { getPriorClaims } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const lookbackDays = Number(req.nextUrl.searchParams.get('lookback_days') || 365)
  return NextResponse.json({ ok: true, ...getPriorClaims(id, lookbackDays) })
}
