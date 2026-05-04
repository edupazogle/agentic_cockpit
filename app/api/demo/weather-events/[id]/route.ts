import { NextRequest, NextResponse } from 'next/server'
import { getWeatherEvent } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  return NextResponse.json({ ok: true, ...getWeatherEvent(id) })
}
