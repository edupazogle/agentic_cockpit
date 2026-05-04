import { NextRequest, NextResponse } from 'next/server'

/**
 * HITL (Human-in-the-Loop) bridge endpoint.
 *
 * Called by the agentic run-store whenever an n8n orchestrator reaches an
 * approval gate. Creates a Chatwoot contact + conversation and posts a
 * formatted HITL card so operators can review and decide inline.
 *
 * Replaces the local_demo.py `_serve_chatwoot_hitl` implementation.
 */

interface HitlRequest {
  scenarioKey?: string
  claimId?: string
  reserveEUR?: number | null
  gatedOn?: Record<string, unknown>
  question?: string
  agent?: string
  context?: string[]
}

function getEnv(key: string, fallback = '') {
  return (process.env[key] ?? '').trim() || fallback
}

function getChatwootConfig() {
  return {
    base: getEnv('CHATWOOT_BASE_URL', 'http://localhost:3500').replace(/\/$/, ''),
    accountId: getEnv('CHATWOOT_ACCOUNT_ID', '1'),
    inboxIdentifier: getEnv('CHATWOOT_INBOX_IDENTIFIER'),
    adminToken: getEnv('CHATWOOT_API_TOKEN'),
  }
}

async function chatwootPost(url: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['api_access_token'] = token

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const json = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, body: json as Record<string, unknown> | null }
}

function buildHitlCard(params: {
  claimId: string
  scenario: string
  question: string
  reserveEUR?: number | null
  agent: string
  gatedOn: Record<string, unknown>
  context: string[]
}) {
  const lines: string[] = [
    `## HITL Approval Gate — ${params.claimId}`,
    '',
    `**Scenario:** ${params.scenario}`,
    `**Agent:** ${params.agent}`,
    params.reserveEUR != null ? `**Reserve:** €${params.reserveEUR.toLocaleString('de-DE')}` : '',
    '',
    `### Decision Required`,
    params.question,
    '',
  ]

  if (Object.keys(params.gatedOn).length > 0) {
    lines.push('### Gate Conditions')
    for (const [k, v] of Object.entries(params.gatedOn)) {
      lines.push(`- **${k}:** ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    }
    lines.push('')
  }

  if (params.context.length > 0) {
    lines.push('### Context')
    for (const line of params.context) {
      lines.push(line)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('*Respond in this conversation to approve or reject. Decisions are logged in the agentic control plane.*')

  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n')
}

export async function POST(req: NextRequest) {
  let payload: HitlRequest
  try {
    payload = (await req.json()) as HitlRequest
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 })
  }

  const config = getChatwootConfig()

  if (!config.inboxIdentifier || !config.adminToken) {
    return NextResponse.json(
      { ok: false, error: 'Chatwoot not configured (CHATWOOT_INBOX_IDENTIFIER or CHATWOOT_API_TOKEN missing)' },
      { status: 503 },
    )
  }

  const claimId = payload.claimId || `CLM-${Date.now().toString(36).toUpperCase()}`
  const scenario = payload.scenarioKey || 'property'
  const agent = payload.agent || 'Hermes · Agentic Control Plane'
  const question = payload.question || 'Review this claim and approve the proposed action.'
  const gatedOn = payload.gatedOn || {}
  const context = payload.context || []

  const contactName = `Claim ${claimId} — HITL`
  const contactEmail = `${claimId.toLowerCase().replace(/[^a-z0-9]/g, '-')}@axa-demo.local`
  const sourceId = `hitl-${claimId}-${Date.now()}`

  // 1. Create contact
  const contactsUrl = `${config.base}/public/api/v1/inboxes/${config.inboxIdentifier}/contacts`
  const { status: cStatus, body: cBody } = await chatwootPost(contactsUrl, {
    name: contactName,
    email: contactEmail,
    identifier: sourceId,
  })

  if (cStatus >= 400 || !cBody?.source_id) {
    return NextResponse.json(
      { ok: false, error: 'Chatwoot contact create failed', detail: cBody },
      { status: cStatus || 500 },
    )
  }

  const cwSourceId = cBody.source_id as string

  // 2. Create conversation
  const convUrl = `${config.base}/public/api/v1/inboxes/${config.inboxIdentifier}/contacts/${cwSourceId}/conversations`
  const { status: vStatus, body: vBody } = await chatwootPost(convUrl, {})

  if (vStatus >= 400 || !vBody?.id) {
    return NextResponse.json(
      { ok: false, error: 'Chatwoot conversation create failed', detail: vBody },
      { status: vStatus || 500 },
    )
  }

  const convId = vBody.id as number

  // 3. Post the HITL card
  const msgContent = buildHitlCard({
    claimId,
    scenario,
    question,
    reserveEUR: payload.reserveEUR,
    agent,
    gatedOn,
    context,
  })

  const msgUrl = `${config.base}/public/api/v1/inboxes/${config.inboxIdentifier}/contacts/${cwSourceId}/conversations/${convId}/messages`
  await chatwootPost(msgUrl, {
    content: msgContent,
    content_type: 'text',
    message_type: 'incoming',
  })

  // 4. Post Hermes greeting via admin API (outgoing bot message)
  const adminMsgUrl = `${config.base}/api/v1/accounts/${config.accountId}/conversations/${convId}/messages`
  await chatwootPost(
    adminMsgUrl,
    {
      content: `Hello, I'm ${agent}. I've prepared a summary of **${claimId}** for your review. Reply **approve** or **reject** with any notes.`,
      message_type: 'outgoing',
      private: false,
    },
    config.adminToken,
  )

  const dashboardUrl = `${config.base}/app/accounts/${config.accountId}/conversations/${convId}`

  return NextResponse.json({
    ok: true,
    conversationId: convId,
    url: dashboardUrl,
    claimId,
    source_id: cwSourceId,
  })
}
