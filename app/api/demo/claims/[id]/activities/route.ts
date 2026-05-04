import { NextRequest, NextResponse } from 'next/server'
import { appendActivity } from '@/lib/server/demo/synthetic-db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const activity = appendActivity(id, {
    activity_type: body.activity_type || 'note',
    description: body.description || '',
    metadata: body.metadata || {},
  })
  if (!activity) {
    return NextResponse.json({ ok: false, error: 'claim not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, activity_id: activity.id, ...activity })
}
