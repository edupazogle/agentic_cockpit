import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const gatewayUrl = process.env.AGENTIC_GATEWAY_URL || 'http://127.0.0.1:8000'

  try {
    const res = await fetch(`${gatewayUrl}/pilots/${slug}/concerns`, {
      headers: { Cookie: _req.headers.get('cookie') || '' },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { concerns: [], error: 'Gateway unreachable' },
      { status: 502 },
    )
  }
}
