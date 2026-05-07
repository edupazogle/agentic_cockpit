import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const body = await req.json().catch(() => ({}))

  const gatewayUrl = process.env.AGENTIC_GATEWAY_URL || 'http://127.0.0.1:8000'

  try {
    const res = await fetch(`${gatewayUrl}/pilots/${slug}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Gateway unreachable', content: 'Compagnon is offline — start the gateway on port 8000.' },
      { status: 502 },
    )
  }
}
