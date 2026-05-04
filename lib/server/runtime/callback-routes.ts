import { z } from 'zod'

import { applyN8nCallback } from '@/lib/server/services/runs'
import { verifyN8nCallbackSignature } from '@/lib/server/runtime/run-store'

const callbackSchema = z.object({
  run_id: z.string().min(1),
  scenario_key: z.string().min(1).optional(),
  workflow_key: z.string().min(1).optional(),
  webhook_path: z.string().min(1).optional(),
  external_execution_id: z.string().min(1).optional(),
  step_key: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
  node_id: z.string().min(1).optional(),
  level: z.enum(['info', 'warning', 'error', 'success']).optional(),
  status: z.enum(['queued', 'running', 'waiting', 'completed', 'failed']).optional(),
  current_step: z.string().min(1).optional(),
  claim_id: z.string().min(1).optional(),
  approval_id: z.string().min(1).optional(),
  vendor_name: z.string().min(1).optional(),
  reserve_eur: z.number().optional(),
  node_updates: z
    .record(z.string(), z.enum(['inactive', 'ready', 'running', 'review']))
    .optional(),
  document_job: z
    .object({
      id: z.string().min(1).optional(),
      workflow_key: z.string().min(1).optional(),
      status: z.string().min(1),
      document_url: z.string().optional(),
      filename: z.string().optional(),
      mime_type: z.string().optional(),
      doc_type: z.string().optional(),
      summary: z.string().optional(),
      request_payload: z.record(z.string(), z.unknown()).optional(),
      response_payload: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  mcp_invocations: z
    .array(
      z.object({
        mcp_domain: z.string().min(1),
        tool_name: z.string().min(1),
        args: z.record(z.string(), z.unknown()).optional(),
        result: z.unknown().optional(),
        ok: z.boolean().optional(),
        retryable: z.boolean().optional(),
        trace_id: z.string().optional(),
      }),
    )
    .optional(),
  chatwoot: z
    .object({
      conversation_id: z.union([z.string(), z.number()]),
      dashboard_url: z.string().min(1),
    })
    .optional(),
  dossier: z
    .object({
      url: z.string().min(1),
    })
    .optional(),
  response_payload: z.record(z.string(), z.unknown()).optional(),
  request_payload: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export async function handleSignedN8nCallback(request: Request, statusOverride?: 'completed' | 'failed') {
  const rawBody = await request.text()
  const signature = request.headers.get('x-agentic-signature')
  const timestamp = request.headers.get('x-agentic-timestamp')
  const sharedSecret = request.headers.get('x-agentic-secret')

  if (!verifyN8nCallbackSignature({ rawBody, signature, timestamp, sharedSecret })) {
    return Response.json({ error: 'Invalid callback signature' }, { status: 401 })
  }

  let decoded: unknown
  try {
    decoded = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Callback body must be valid JSON' }, { status: 400 })
  }

  const parsedBody = callbackSchema.safeParse(decoded)
  if (!parsedBody.success) {
    return Response.json(
      {
        error: 'Invalid callback payload',
        detail: parsedBody.error.flatten(),
      },
      { status: 400 },
    )
  }

  const run = await applyN8nCallback(parsedBody.data, statusOverride)

  if (!run) {
    return Response.json({ error: 'Run not found' }, { status: 404 })
  }

  return Response.json({ ok: true, run })
}
