import fs from 'node:fs'
import path from 'node:path'

import type { ScenarioRun, ScenarioRunEvent } from '@/lib/domain/types'

interface ChatConfig {
  hitlBaseUrl: string
  chatwootBaseUrl: string
  accountId: string
  adminToken: string | null
}

interface HitlConversationPayload {
  scenarioKey: string
  claimId?: string
  reserveEUR?: number
  approvalId?: string
  vendorName?: string
  question: string
  agent?: string
  contextLines?: string[]
  gatedOn?: Record<string, unknown>
}

interface HitlConversationResult {
  conversationId: string | number
  dashboardUrl: string
  claimId?: string
  dossierUrl?: string
}

let cachedConfig: ChatConfig | null = null

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((acc, rawLine) => {
      const line = rawLine.trim()
      if (!line || line.startsWith('#') || !line.includes('=')) {
        return acc
      }

      const index = line.indexOf('=')
      const key = line.slice(0, index).trim()
      let value = line.slice(index + 1).trim()
      if (value.includes(' #')) {
        value = value.split(' #', 1)[0].trimEnd()
      }
      acc[key] = value.replace(/^['"]|['"]$/g, '')
      return acc
    }, {})
}

function loadEnvFallback() {
  const cwd = process.cwd()
  const envFiles = [
    process.env.AGENTIC_SHARED_ENV_FILE,
    path.join(cwd, '.env'),
    path.join(cwd, '.env.local'),
    path.join(cwd, '../imane/.env'),
    path.join(cwd, '../imane/.env.local'),
    path.join(cwd, '../imane/scrollytelling/app/.env.local'),
  ].filter((value): value is string => Boolean(value))

  return envFiles.reduce<Record<string, string>>((acc, filePath) => {
    return {
      ...acc,
      ...parseEnvFile(filePath),
    }
  }, {})
}

function scenarioToken(scenarioKey: string) {
  if (scenarioKey === 'motor-fleet') return 'fleet'
  if (scenarioKey === 'cargo-recovery') return 'property'
  return scenarioKey.startsWith('property') ? 'property' : scenarioKey.split('-')[0] || 'property'
}

function getChatConfig() {
  if (cachedConfig) {
    return cachedConfig
  }

  const fallback = loadEnvFallback()
  cachedConfig = {
    hitlBaseUrl: (
      process.env.AGENTIC_HITL_BASE_URL ||
      process.env.HITL_BRIDGE_BASE_URL ||
      fallback.AGENTIC_HITL_BASE_URL ||
      'http://127.0.0.1:8010'
    )
      .trim()
      .replace(/\/$/, ''),
    chatwootBaseUrl: (
      process.env.CHATWOOT_BASE_URL ||
      process.env.VITE_CHATWOOT_BASE_URL ||
      fallback.CHATWOOT_BASE_URL ||
      fallback.VITE_CHATWOOT_BASE_URL ||
      'http://localhost:3000'
    )
      .trim()
      .replace(/\/$/, ''),
    accountId: (
      process.env.CHATWOOT_ACCOUNT_ID ||
      process.env.CHATWOOT_ACCT2_ACCOUNT_ID ||
      process.env.VITE_CHATWOOT_ACCOUNT_ID ||
      fallback.CHATWOOT_ACCOUNT_ID ||
      fallback.CHATWOOT_ACCT2_ACCOUNT_ID ||
      '2'
    ).trim(),
    adminToken: (
      process.env.CHATWOOT_API_TOKEN ||
      process.env.CHATWOOT_ACCT2_TOKEN ||
      fallback.CHATWOOT_API_TOKEN ||
      fallback.CHATWOOT_ACCT2_TOKEN ||
      ''
    ).trim() || null,
  }

  return cachedConfig
}

function buildQuestion(payload: HitlConversationPayload) {
  if (payload.approvalId) {
    return `Review ${payload.claimId || 'claim'} and decide on ${payload.approvalId}.`
  }

  if (payload.vendorName) {
    return `Review ${payload.vendorName} for ${payload.claimId || 'the claim'} and approve dispatch.`
  }

  return payload.question
}

export async function openHitlConversation(payload: HitlConversationPayload) {
  const config = getChatConfig()

  const response = await fetch(`${config.hitlBaseUrl}/api/chatwoot/hitl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      scenarioKey: scenarioToken(payload.scenarioKey),
      claimId: payload.claimId,
      reserveEUR: payload.reserveEUR,
      gatedOn: payload.gatedOn ?? {},
      question: buildQuestion(payload),
      agent: payload.agent || 'Hermes · Agentic Control Plane',
      context: payload.contextLines ?? [],
    }),
    cache: 'no-store',
  })

  const body = (await response.json().catch(() => null)) as
    | {
        ok?: boolean
        conversationId?: string | number
        url?: string
        claimId?: string
      }
    | null

  if (!response.ok || !body?.conversationId || !body.url) {
    throw new Error(`Failed to open HITL conversation: HTTP ${response.status}`)
  }

  const claimId = body.claimId || payload.claimId
  return {
    conversationId: body.conversationId,
    dashboardUrl: body.url,
    claimId,
    dossierUrl: claimId ? `${config.hitlBaseUrl}/dossiers/${claimId}.pdf` : undefined,
  } satisfies HitlConversationResult
}

export async function postChatwootUpdateMessage(params: {
  conversationId: string | number
  content: string
}) {
  const config = getChatConfig()

  if (!config.adminToken) {
    throw new Error('Missing Chatwoot admin token')
  }

  const response = await fetch(
    `${config.chatwootBaseUrl}/api/v1/accounts/${config.accountId}/conversations/${params.conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_access_token: config.adminToken,
      },
      body: JSON.stringify({
        content: params.content,
        message_type: 'outgoing',
        private: false,
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to post Chatwoot message: HTTP ${response.status} ${body.slice(0, 240)}`)
  }

  return response.json().catch(() => null)
}

function truncateJson(value: unknown, maxLength = 240) {
  if (value == null) return null
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

export function renderOperatorUpdateMessage(run: ScenarioRun, event: ScenarioRunEvent) {
  const payload = event.payload ?? {}
  const lines = [
    `**${event.label}**`,
    event.detail,
  ]

  const mcpInvocations = payload.mcp_invocations ?? []
  if (mcpInvocations.length) {
    lines.push(
      `MCP tools: ${mcpInvocations
        .map((item) => `\`${item.mcp_domain}.${item.tool_name}\``)
        .join(', ')}`,
    )
  }

  if (payload.document_job) {
    lines.push(
      `Document job: ${payload.document_job.status}${
        payload.document_job.doc_type ? ` · ${payload.document_job.doc_type}` : ''
      }`,
    )
  }

  if (payload.response_payload) {
    const excerpt = truncateJson(payload.response_payload)
    if (excerpt) {
      lines.push(`Response: \`${excerpt}\``)
    }
  }

  if (run.vendorName) {
    lines.push(`Vendor: ${run.vendorName}`)
  }

  if (run.dossierUrl) {
    lines.push(`[Open dossier](${run.dossierUrl})`)
  }

  return lines.join('\n\n')
}
