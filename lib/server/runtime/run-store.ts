import crypto from 'node:crypto'

import type {
  McpInvocation,
  NodeStatus,
  RunEventLevel,
  RunStatus,
  ScenarioRecord,
  ScenarioRun,
  ScenarioRunEvent,
  ScenarioRunEventPayload,
} from '@/lib/domain/types'
import {
  openHitlConversation,
  postChatwootUpdateMessage,
  renderOperatorUpdateMessage,
} from '@/lib/server/integrations/chat-webhook'
import {
  SupabaseHttpError,
  supabaseRequest,
  supabaseSelect,
} from '@/lib/server/integrations/supabase'

interface N8nWorkflowRow {
  workflow_id: string
  n8n_workflow_id?: string
  name: string
  description: string | null
  webhook_path: string
  scenario: string[]
  kind: string
  active: boolean
}

interface N8nMcpToolRow {
  workflow_id: string
  tool_name: string
  description: string | null
  args_schema: Record<string, unknown> | null
}

interface WorkflowDispatchRecord {
  id: string
  workflowKey: string
  webhookPath: string
  dispatchState: string
  externalExecutionId?: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface DocumentJobRecord {
  id: string
  workflowKey: string
  status: string
  documentUrl?: string
  filename?: string
  mimeType?: string
  docType?: string
  summary?: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface RuntimeSnapshot {
  run: ScenarioRun
  dispatches: WorkflowDispatchRecord[]
  documentJobs: DocumentJobRecord[]
}

interface StartRunOptions {
  callbackBaseUrl: string
  startedBy?: string
  requestPayload?: Record<string, unknown>
}

interface IngestedCallback {
  run_id: string
  scenario_key?: string
  workflow_key?: string
  webhook_path?: string
  external_execution_id?: string
  step_key: string
  label: string
  detail: string
  node_id?: string
  level?: RunEventLevel
  status?: RunStatus
  current_step?: string
  claim_id?: string
  approval_id?: string
  vendor_name?: string
  reserve_eur?: number
  node_updates?: Record<string, NodeStatus>
  document_job?: {
    id?: string
    workflow_key?: string
    status: string
    document_url?: string
    filename?: string
    mime_type?: string
    doc_type?: string
    summary?: string
    request_payload?: Record<string, unknown>
    response_payload?: Record<string, unknown>
  }
  mcp_invocations?: McpInvocation[]
  chatwoot?: {
    conversation_id: string | number
    dashboard_url: string
  }
  dossier?: {
    url: string
  }
  response_payload?: Record<string, unknown>
  request_payload?: Record<string, unknown>
  payload?: Record<string, unknown>
}

interface ScenarioRunRow {
  id: string
  scenario_key: string
  status: RunStatus
  started_by: string | null
  current_step: string | null
  reserve_eur: number | string | null
  vendor_name: string | null
  claim_id: string | null
  approval_id: string | null
  workflow_key: string | null
  dispatch_state: string | null
  node_states: Record<string, NodeStatus> | null
  runtime_metadata: Record<string, unknown> | null
  run_source: string
  started_at: string
  updated_at: string
  finished_at: string | null
}

interface ScenarioRunEventRow {
  id: string
  run_id: string
  scenario_key: string
  step_key: string
  label: string
  detail: string
  node_id: string | null
  level: RunEventLevel
  created_at: string
  payload: Record<string, unknown> | null
}

interface WorkflowDispatchRow {
  id: string
  run_id: string
  scenario_key: string
  workflow_key: string
  webhook_path: string | null
  external_execution_id: string | null
  dispatch_state: string
  request_payload: Record<string, unknown> | null
  response_payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface DocumentJobRow {
  id: string
  run_id: string | null
  scenario_key: string
  workflow_key: string | null
  document_url: string | null
  filename: string | null
  mime_type: string | null
  doc_type: string | null
  status: string
  summary: string | null
  provider: string
  request_payload: Record<string, unknown> | null
  response_payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type RuntimePersistenceMode = 'tables' | 'storage'

const STORAGE_BUCKET = process.env.AGENTIC_RUNTIME_BUCKET || 'agentic-runtime'
const STORAGE_PREFIX = 'runtime'

let runtimeModePromise: Promise<RuntimePersistenceMode> | null = null
let storageBucketReadyPromise: Promise<void> | null = null

function nowIso() {
  return new Date().toISOString()
}

function getN8nBaseUrl() {
  return (process.env.N8N_BASE_URL || 'http://127.0.0.1:5678').trim().replace(/\/$/, '')
}

function getCallbackSecret() {
  return (process.env.N8N_CALLBACK_SECRET || 'agentic-local-callback-secret').trim()
}

function storagePathForRun(runId: string) {
  return `${STORAGE_PREFIX}/runs/${runId}.json`
}

function initialNodeStates(scenario: ScenarioRecord): Record<string, NodeStatus> {
  return Object.fromEntries(scenario.nodes.map((node) => [node.id, node.status]))
}

function scenarioToken(scenarioKey: string) {
  if (scenarioKey === 'property-fast-track') return 'property'
  if (scenarioKey === 'motor-fleet') return 'fleet'
  if (scenarioKey === 'cargo-recovery') return 'cargo'
  return scenarioKey.split('-')[0] || scenarioKey
}

function defaultDocumentForScenario(
  scenario: ScenarioRecord,
  requestPayload?: Record<string, unknown>,
) {
  const document = (requestPayload?.document ?? null) as Record<string, unknown> | null

  if (document) {
    return {
      url: String(document.url || ''),
      filename: String(document.filename || `${scenario.id}.pdf`),
      mime_type: String(document.mime_type || 'application/pdf'),
    }
  }

  if (scenario.id === 'motor-fleet') {
    return {
      url: 'https://example.invalid/fleet-telematics-export.csv',
      filename: 'fleet-telematics-export.csv',
      mime_type: 'text/csv',
    }
  }

  return {
    url: 'https://example.invalid/property-adjuster-prelim-report.pdf',
    filename: 'property-adjuster-prelim-report.pdf',
    mime_type: 'application/pdf',
  }
}

function runFromRow(row: ScenarioRunRow, events: ScenarioRunEventRow[], runtimeMode: RuntimePersistenceMode): ScenarioRun {
  const runtimeMetadata = row.runtime_metadata ?? {}
  const documentJob = runtimeMetadata.document_job as ScenarioRun['documentJob'] | null
  const chatThread = runtimeMetadata.chat_thread as ScenarioRun['chatThread'] | null
  const dossierUrl = runtimeMetadata.dossier_url as string | null
  const lastMcpInvocation = runtimeMetadata.last_mcp_invocation as McpInvocation | null
  const operatorMilestones = runtimeMetadata.operator_milestones as string[] | null

  return {
    id: row.id,
    scenarioKey: row.scenario_key,
    status: row.status,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at || undefined,
    currentStep: row.current_step || undefined,
    claimId: row.claim_id || undefined,
    approvalId: row.approval_id || undefined,
    vendorName: row.vendor_name || undefined,
    reserveEUR: row.reserve_eur == null ? undefined : Number(row.reserve_eur),
    workflowKey: row.workflow_key || undefined,
    dispatchState: row.dispatch_state || undefined,
    runtimeMode,
    documentJob: documentJob || undefined,
    chatThread: chatThread || undefined,
    dossierUrl: dossierUrl || undefined,
    lastMcpInvocation: lastMcpInvocation || undefined,
    operatorMilestones: operatorMilestones || [],
    nodeStates: row.node_states ?? {},
    events: events
      .sort((left, right) => left.created_at.localeCompare(right.created_at))
      .map((event) => ({
        id: event.id,
        runId: event.run_id,
        scenarioKey: event.scenario_key,
        stepKey: event.step_key,
        label: event.label,
        detail: event.detail,
        nodeId: event.node_id || undefined,
        level: event.level,
        createdAt: event.created_at,
        payload: event.payload ?? undefined,
      })),
  }
}

function snapshotFromRows(
  run: ScenarioRunRow,
  events: ScenarioRunEventRow[],
  dispatches: WorkflowDispatchRow[],
  documentJobs: DocumentJobRow[],
  runtimeMode: RuntimePersistenceMode,
): RuntimeSnapshot {
  const snapshotRun = runFromRow(run, events, runtimeMode)
  const latestDocumentJob = documentJobs
    .slice()
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0]

  if (latestDocumentJob) {
    snapshotRun.documentJob = {
      id: latestDocumentJob.id,
      status: latestDocumentJob.status,
      documentUrl: latestDocumentJob.document_url || undefined,
      docType: latestDocumentJob.doc_type || undefined,
      summary: latestDocumentJob.summary || undefined,
    }
  }

  return {
    run: snapshotRun,
    dispatches: dispatches.map((dispatch) => ({
      id: dispatch.id,
      workflowKey: dispatch.workflow_key,
      webhookPath: dispatch.webhook_path || '',
      dispatchState: dispatch.dispatch_state,
      externalExecutionId: dispatch.external_execution_id || undefined,
      requestPayload: dispatch.request_payload ?? undefined,
      responsePayload: dispatch.response_payload ?? undefined,
      createdAt: dispatch.created_at,
      updatedAt: dispatch.updated_at,
    })),
    documentJobs: documentJobs.map((job) => ({
      id: job.id,
      workflowKey: job.workflow_key || 'wf006::docs/ingest',
      status: job.status,
      documentUrl: job.document_url || undefined,
      filename: job.filename || undefined,
      mimeType: job.mime_type || undefined,
      docType: job.doc_type || undefined,
      summary: job.summary || undefined,
      requestPayload: job.request_payload ?? undefined,
      responsePayload: job.response_payload ?? undefined,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })),
  }
}

function appendEvent(
  snapshot: RuntimeSnapshot,
  event: Omit<ScenarioRunEvent, 'id' | 'runId' | 'scenarioKey' | 'createdAt'>,
) {
  const nextEvent: ScenarioRunEvent = {
    id: crypto.randomUUID(),
    runId: snapshot.run.id,
    scenarioKey: snapshot.run.scenarioKey,
    createdAt: nowIso(),
    ...event,
  }

  snapshot.run.events.push(nextEvent)
}

function buildEventPayload(callback: IngestedCallback): ScenarioRunEventPayload | undefined {
  const payload: ScenarioRunEventPayload = {
    ...(callback.payload ?? {}),
  }

  if (callback.request_payload) {
    payload.request_payload = callback.request_payload
  }

  if (callback.response_payload) {
    payload.response_payload = callback.response_payload
  }

  if (callback.mcp_invocations?.length) {
    payload.mcp_invocations = callback.mcp_invocations
  }

  if (callback.document_job) {
    payload.document_job = {
      id: callback.document_job.id,
      status: callback.document_job.status,
      document_url: callback.document_job.document_url,
      filename: callback.document_job.filename,
      mime_type: callback.document_job.mime_type,
      doc_type: callback.document_job.doc_type,
      summary: callback.document_job.summary,
    }
  }

  if (callback.chatwoot) {
    payload.chatwoot = callback.chatwoot
  }

  if (callback.dossier) {
    payload.dossier = callback.dossier
  }

  return Object.keys(payload).length ? payload : undefined
}

function normalizeMilestoneKey(stepKey: string, suffix: string) {
  return `${stepKey}::${suffix}`
}

function shouldOpenOperatorThread(snapshot: RuntimeSnapshot, callback: IngestedCallback) {
  if (snapshot.run.chatThread || !snapshot.run.claimId) {
    return false
  }

  return (
    callback.status === 'waiting' ||
    Boolean(callback.approval_id) ||
    callback.step_key.includes('approval') ||
    callback.step_key.includes('review') ||
    callback.step_key.includes('reserve-gate') ||
    callback.document_job?.status === 'completed'
  )
}

function buildOperatorContextLines(snapshot: RuntimeSnapshot, callback: IngestedCallback) {
  const lines = [
    `Scenario: ${snapshot.run.scenarioKey}`,
    `Run: ${snapshot.run.id}`,
  ]

  if (snapshot.run.claimId) {
    lines.push(`Claim: ${snapshot.run.claimId}`)
  }
  if (snapshot.run.approvalId || callback.approval_id) {
    lines.push(`Approval: ${callback.approval_id || snapshot.run.approvalId}`)
  }
  if (typeof snapshot.run.reserveEUR === 'number') {
    lines.push(`Reserve: EUR ${snapshot.run.reserveEUR.toFixed(0)}`)
  }
  if (snapshot.run.vendorName || callback.vendor_name) {
    lines.push(`Vendor: ${callback.vendor_name || snapshot.run.vendorName}`)
  }
  if (callback.document_job?.summary) {
    lines.push(`Document: ${callback.document_job.summary}`)
  }
  if (callback.mcp_invocations?.length) {
    lines.push(
      `MCP: ${callback.mcp_invocations
        .map((item) => `${item.mcp_domain}.${item.tool_name}`)
        .join(', ')}`,
    )
  }

  return lines
}

async function reconcileOperatorArtifacts(snapshot: RuntimeSnapshot, callback: IngestedCallback) {
  snapshot.run.operatorMilestones = snapshot.run.operatorMilestones ?? []

  if (shouldOpenOperatorThread(snapshot, callback)) {
    try {
      const hitl = await openHitlConversation({
        scenarioKey: snapshot.run.scenarioKey,
        claimId: snapshot.run.claimId,
        reserveEUR: snapshot.run.reserveEUR,
        approvalId: callback.approval_id || snapshot.run.approvalId,
        vendorName: snapshot.run.vendorName,
        question: callback.detail,
        agent: callback.label,
        contextLines: buildOperatorContextLines(snapshot, callback),
        gatedOn: {
          step_key: callback.step_key,
          workflow_key: callback.workflow_key || snapshot.run.workflowKey,
          document_job: callback.document_job || null,
        },
      })

      snapshot.run.chatThread = {
        conversationId: hitl.conversationId,
        dashboardUrl: hitl.dashboardUrl,
      }
      snapshot.run.dossierUrl = hitl.dossierUrl || snapshot.run.dossierUrl
      snapshot.run.claimId = hitl.claimId || snapshot.run.claimId

      appendEvent(snapshot, {
        stepKey: `${callback.step_key}-operator-thread`,
        label: 'Operator thread opened',
        detail: `Fresh Chatwoot conversation ${hitl.conversationId} opened for live review.`,
        level: 'success',
        payload: {
          chatwoot: {
            conversation_id: hitl.conversationId,
            dashboard_url: hitl.dashboardUrl,
          },
          dossier: hitl.dossierUrl ? { url: hitl.dossierUrl } : undefined,
        },
      })
    } catch (error) {
      appendEvent(snapshot, {
        stepKey: `${callback.step_key}-operator-thread-error`,
        label: 'Operator thread failed',
        detail: error instanceof Error ? error.message : 'Failed to open operator conversation',
        level: 'warning',
      })
    }
  }

  const thread = snapshot.run.chatThread
  if (!thread) {
    return
  }

  const shouldPostMilestone =
    callback.step_key === 'docs-start' ||
    callback.step_key === 'review' ||
    callback.step_key === 'dispatch-prep' ||
    callback.step_key === 'dispatch-confirmed' ||
    callback.step_key === 'shop-booked' ||
    callback.step_key === 'failed' ||
    callback.status === 'failed'

  if (!shouldPostMilestone) {
    return
  }

  const milestoneKey = normalizeMilestoneKey(
    callback.step_key,
    callback.status || callback.level || 'info',
  )

  if (snapshot.run.operatorMilestones.includes(milestoneKey)) {
    return
  }

  try {
    const event =
      snapshot.run.events
        .slice()
        .reverse()
        .find((entry) => entry.stepKey === callback.step_key) ??
      snapshot.run.events[snapshot.run.events.length - 1]
    if (event) {
      await postChatwootUpdateMessage({
        conversationId: thread.conversationId,
        content: renderOperatorUpdateMessage(snapshot.run, event),
      })
      snapshot.run.operatorMilestones.push(milestoneKey)
    }
  } catch (error) {
    appendEvent(snapshot, {
      stepKey: `${callback.step_key}-chat-update-error`,
      label: 'Operator update failed',
      detail: error instanceof Error ? error.message : 'Failed to post Chatwoot update',
      level: 'warning',
    })
  }
}

function updateRunWithCallback(
  snapshot: RuntimeSnapshot,
  callback: IngestedCallback,
  statusOverride?: RunStatus,
) {
  const nextStatus = statusOverride || callback.status
  if (nextStatus) {
    snapshot.run.status = nextStatus
  }

  if (callback.current_step) {
    snapshot.run.currentStep = callback.current_step
  } else if (callback.step_key) {
    snapshot.run.currentStep = callback.step_key
  }

  if (callback.claim_id) {
    snapshot.run.claimId = callback.claim_id
  }

  if (callback.approval_id) {
    snapshot.run.approvalId = callback.approval_id
  }

  if (callback.vendor_name) {
    snapshot.run.vendorName = callback.vendor_name
  }

  if (typeof callback.reserve_eur === 'number') {
    snapshot.run.reserveEUR = callback.reserve_eur
  }

  if (callback.workflow_key) {
    snapshot.run.workflowKey = callback.workflow_key
  }

  if (callback.node_updates) {
    snapshot.run.nodeStates = {
      ...snapshot.run.nodeStates,
      ...callback.node_updates,
    }
  }

  if (callback.document_job) {
    const incoming = callback.document_job
    const existing = snapshot.documentJobs.find((job) => job.id === incoming.id)
    const updatedAt = nowIso()

    if (existing) {
      existing.status = incoming.status
      existing.docType = incoming.doc_type || existing.docType
      existing.summary = incoming.summary || existing.summary
      existing.documentUrl = incoming.document_url || existing.documentUrl
      existing.filename = incoming.filename || existing.filename
      existing.mimeType = incoming.mime_type || existing.mimeType
      existing.requestPayload = incoming.request_payload || existing.requestPayload
      existing.responsePayload = incoming.response_payload || existing.responsePayload
      existing.updatedAt = updatedAt
    } else {
      snapshot.documentJobs.push({
        id: incoming.id || crypto.randomUUID(),
        workflowKey: incoming.workflow_key || callback.workflow_key || 'wf006::docs/ingest',
        status: incoming.status,
        docType: incoming.doc_type || undefined,
        summary: incoming.summary || undefined,
        documentUrl: incoming.document_url || undefined,
        filename: incoming.filename || undefined,
        mimeType: incoming.mime_type || undefined,
        requestPayload: incoming.request_payload || undefined,
        responsePayload: incoming.response_payload || undefined,
        createdAt: updatedAt,
        updatedAt,
      })
    }

    const latest = snapshot.documentJobs
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

    if (latest) {
      snapshot.run.documentJob = {
        id: latest.id,
        status: latest.status,
        documentUrl: latest.documentUrl,
        docType: latest.docType,
        summary: latest.summary,
      }
    }
  }

  if (callback.chatwoot) {
    snapshot.run.chatThread = {
      conversationId: callback.chatwoot.conversation_id,
      dashboardUrl: callback.chatwoot.dashboard_url,
    }
  }

  if (callback.dossier?.url) {
    snapshot.run.dossierUrl = callback.dossier.url
  }

  if (callback.mcp_invocations?.length) {
    snapshot.run.lastMcpInvocation = callback.mcp_invocations[callback.mcp_invocations.length - 1]
  }

  appendEvent(snapshot, {
    stepKey: callback.step_key,
    label: callback.label,
    detail: callback.detail,
    nodeId: callback.node_id,
    level: callback.level ?? 'info',
    payload: buildEventPayload(callback),
  })

  const eventTime = nowIso()
  snapshot.run.updatedAt = eventTime
  if (snapshot.run.status === 'completed' || snapshot.run.status === 'failed') {
    snapshot.run.finishedAt = snapshot.run.finishedAt || eventTime
  }

  if (callback.workflow_key) {
    const existingDispatch = snapshot.dispatches.find(
      (dispatch) => dispatch.workflowKey === callback.workflow_key,
    )

    if (existingDispatch) {
      existingDispatch.dispatchState = snapshot.run.status
      existingDispatch.externalExecutionId =
        callback.external_execution_id || existingDispatch.externalExecutionId
      existingDispatch.responsePayload =
        callback.response_payload || existingDispatch.responsePayload
      existingDispatch.updatedAt = eventTime
    }
  }
}

async function resolveRuntimeMode(): Promise<RuntimePersistenceMode> {
  if (!runtimeModePromise) {
    runtimeModePromise = (async () => {
      try {
        await supabaseSelect<unknown[]>('scenario_runs', {
          select: 'id',
          limit: '1',
        })
        return 'tables'
      } catch (error) {
        if (
          error instanceof SupabaseHttpError &&
          error.status === 404 &&
          error.detail.includes('PGRST205')
        ) {
          return 'storage'
        }

        throw error
      }
    })()
  }

  return runtimeModePromise
}

async function ensureRuntimeBucket() {
  if (!storageBucketReadyPromise) {
    storageBucketReadyPromise = (async () => {
      const buckets = await supabaseRequest<Array<{ id: string; name: string }>>({
        path: '/storage/v1/bucket',
      })

      if (buckets.some((bucket) => bucket.id === STORAGE_BUCKET || bucket.name === STORAGE_BUCKET)) {
        return
      }

      await supabaseRequest({
        method: 'POST',
        path: '/storage/v1/bucket',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: STORAGE_BUCKET,
          name: STORAGE_BUCKET,
          public: false,
        }),
        responseType: 'json',
      })
    })()
  }

  return storageBucketReadyPromise
}

async function loadSnapshotFromStorage(runId: string): Promise<RuntimeSnapshot | null> {
  await ensureRuntimeBucket()

  try {
    const raw = await supabaseRequest<string>({
      path: `/storage/v1/object/${STORAGE_BUCKET}/${storagePathForRun(runId)}`,
      responseType: 'text',
    })

    return JSON.parse(raw) as RuntimeSnapshot
  } catch (error) {
    if (error instanceof SupabaseHttpError && error.status === 400) {
      return null
    }

    if (error instanceof SupabaseHttpError && error.status === 404) {
      return null
    }

    throw error
  }
}

async function saveSnapshotToStorage(snapshot: RuntimeSnapshot) {
  await ensureRuntimeBucket()

  await supabaseRequest({
    method: 'POST',
    path: `/storage/v1/object/${STORAGE_BUCKET}/${storagePathForRun(snapshot.run.id)}`,
    headers: {
      'Content-Type': 'application/json',
      'x-upsert': 'true',
    },
    body: JSON.stringify(snapshot),
    responseType: 'json',
  })
}

async function loadSnapshotFromTables(runId: string): Promise<RuntimeSnapshot | null> {
  const runs = await supabaseSelect<ScenarioRunRow[]>('scenario_runs', {
    select:
      'id,scenario_key,status,started_by,current_step,reserve_eur,vendor_name,claim_id,approval_id,workflow_key,dispatch_state,node_states,runtime_metadata,run_source,started_at,updated_at,finished_at',
    id: `eq.${runId}`,
    limit: '1',
  })

  const run = runs[0]
  if (!run) {
    return null
  }

  const [events, dispatches, documentJobs] = await Promise.all([
    supabaseSelect<ScenarioRunEventRow[]>('scenario_run_events', {
      select: 'id,run_id,scenario_key,step_key,label,detail,node_id,level,created_at,payload',
      run_id: `eq.${runId}`,
      order: 'created_at.asc',
    }),
    supabaseSelect<WorkflowDispatchRow[]>('workflow_dispatches', {
      select:
        'id,run_id,scenario_key,workflow_key,webhook_path,external_execution_id,dispatch_state,request_payload,response_payload,created_at,updated_at',
      run_id: `eq.${runId}`,
      order: 'created_at.asc',
    }),
    supabaseSelect<DocumentJobRow[]>('document_jobs', {
      select:
        'id,run_id,scenario_key,workflow_key,document_url,filename,mime_type,doc_type,status,summary,provider,request_payload,response_payload,created_at,updated_at',
      run_id: `eq.${runId}`,
      order: 'created_at.asc',
    }),
  ])

  return snapshotFromRows(run, events, dispatches, documentJobs, 'tables')
}

async function replaceTableRows<T extends Record<string, unknown>>(table: string, runId: string, rows: T[]) {
  await supabaseRequest({
    method: 'DELETE',
    path: `/rest/v1/${table}`,
    query: {
      run_id: `eq.${runId}`,
    },
    headers: {
      Prefer: 'return=minimal',
    },
    responseType: 'void',
  })

  if (!rows.length) {
    return
  }

  await supabaseRequest({
    method: 'POST',
    path: `/rest/v1/${table}`,
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
    responseType: 'void',
  })
}

async function saveSnapshotToTables(snapshot: RuntimeSnapshot) {
  const run = snapshot.run
  const runPayload = {
    id: run.id,
    scenario_key: run.scenarioKey,
    status: run.status,
    started_by: 'agentic-web',
    current_step: run.currentStep ?? null,
    reserve_eur: run.reserveEUR ?? null,
    vendor_name: run.vendorName ?? null,
    claim_id: run.claimId ?? null,
    approval_id: run.approvalId ?? null,
    workflow_key: run.workflowKey ?? null,
    dispatch_state: run.dispatchState ?? null,
    node_states: run.nodeStates,
    runtime_metadata: {
      runtime_mode: run.runtimeMode ?? 'tables',
      document_job: run.documentJob ?? null,
      chat_thread: run.chatThread ?? null,
      dossier_url: run.dossierUrl ?? null,
      last_mcp_invocation: run.lastMcpInvocation ?? null,
      operator_milestones: run.operatorMilestones ?? [],
    },
    run_source: 'agentic-web',
    started_at: run.startedAt,
    updated_at: run.updatedAt ?? nowIso(),
    finished_at: run.finishedAt ?? null,
  }

  await supabaseRequest({
    method: 'POST',
    path: '/rest/v1/scenario_runs',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(runPayload),
    responseType: 'void',
  })

  await Promise.all([
    replaceTableRows(
      'scenario_run_events',
      run.id,
      snapshot.run.events.map((event) => ({
        id: event.id,
        run_id: event.runId,
        scenario_key: event.scenarioKey,
        step_key: event.stepKey,
        label: event.label,
        detail: event.detail,
        node_id: event.nodeId ?? null,
        level: event.level,
        created_at: event.createdAt,
        payload: event.payload ?? null,
      })),
    ),
    replaceTableRows(
      'workflow_dispatches',
      run.id,
      snapshot.dispatches.map((dispatch) => ({
        id: dispatch.id,
        run_id: run.id,
        scenario_key: run.scenarioKey,
        workflow_key: dispatch.workflowKey,
        webhook_path: dispatch.webhookPath,
        external_execution_id: dispatch.externalExecutionId ?? null,
        dispatch_state: dispatch.dispatchState,
        request_payload: dispatch.requestPayload ?? null,
        response_payload: dispatch.responsePayload ?? null,
        created_at: dispatch.createdAt,
        updated_at: dispatch.updatedAt,
      })),
    ),
    replaceTableRows(
      'document_jobs',
      run.id,
      snapshot.documentJobs.map((job) => ({
        id: job.id,
        run_id: run.id,
        scenario_key: run.scenarioKey,
        workflow_key: job.workflowKey,
        document_url: job.documentUrl ?? null,
        filename: job.filename ?? null,
        mime_type: job.mimeType ?? null,
        doc_type: job.docType ?? null,
        status: job.status,
        summary: job.summary ?? null,
        provider: 'docling',
        request_payload: job.requestPayload ?? null,
        response_payload: job.responsePayload ?? null,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      })),
    ),
  ])
}

async function loadSnapshot(runId: string) {
  const runtimeMode = await resolveRuntimeMode()

  if (runtimeMode === 'tables') {
    return loadSnapshotFromTables(runId)
  }

  return loadSnapshotFromStorage(runId)
}

async function saveSnapshot(snapshot: RuntimeSnapshot) {
  snapshot.run.updatedAt = snapshot.run.updatedAt || nowIso()
  snapshot.run.runtimeMode = await resolveRuntimeMode()

  if (snapshot.run.runtimeMode === 'tables') {
    return saveSnapshotToTables(snapshot)
  }

  return saveSnapshotToStorage(snapshot)
}

async function resolveWorkflowCatalog(scenarioKey: string) {
  const token = scenarioToken(scenarioKey)
  const [workflows, mcpTools] = await Promise.all([
    supabaseSelect<N8nWorkflowRow[]>('n8n_workflows', {
      select: 'workflow_id,n8n_workflow_id,name,description,webhook_path,scenario,kind,active',
      scenario: `cs.{${token}}`,
      active: 'eq.true',
      order: 'workflow_id.asc',
    }),
    supabaseSelect<
      Array<{
        workflow_id: string
        tool_name: string
        description: string | null
        args_schema: Record<string, unknown> | null
      }>
    >('n8n_mcp_tools', {
      select: 'workflow_id,tool_name,description,args_schema',
      order: 'tool_name.asc',
    }),
  ])

  const orchestrator =
    workflows.find(
      (workflow) => workflow.kind === 'orchestrator' && workflow.webhook_path.endsWith('-v2'),
    ) ?? workflows.find((workflow) => workflow.kind === 'orchestrator')

  const docsWorkflow =
    workflows.find((workflow) => workflow.webhook_path === 'docs/ingest') ??
    workflows.find((workflow) => workflow.workflow_id === 'wf006::docs/ingest')

  const relevantTools = mcpTools.filter((tool) =>
    workflows.some((workflow) => workflow.workflow_id === tool.workflow_id),
  )

  return {
    token,
    workflows,
    orchestrator,
    docsWorkflow,
    mcpTools: relevantTools.map((tool) => ({
      workflow_id: tool.workflow_id,
      tool_name: tool.tool_name,
      description: tool.description,
      args_schema: tool.args_schema,
    })) as N8nMcpToolRow[],
  }
}

async function callN8nWebhook<T>(
  path: string,
  init: {
    method?: 'GET' | 'POST'
    body?: Record<string, unknown>
    searchParams?: Record<string, string>
  },
): Promise<T> {
  const url = new URL(`${getN8nBaseUrl()}/webhook/${path}`)
  Object.entries(init.searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url, {
    method: init.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })

  const raw = await response.text()
  let payload: T | { ok?: boolean; error?: string }
  try {
    payload = raw ? (JSON.parse(raw) as T) : ({} as T)
  } catch {
    payload = { error: raw }
  }

  if (!response.ok) {
    throw new Error(`n8n webhook ${path} failed: HTTP ${response.status} ${raw.slice(0, 240)}`)
  }

  return payload as T
}

function signCallbackBody(timestamp: string, rawBody: string) {
  return crypto.createHmac('sha256', getCallbackSecret()).update(`${timestamp}.${rawBody}`).digest('hex')
}

export function verifyN8nCallbackSignature({
  rawBody,
  signature,
  timestamp,
  sharedSecret,
}: {
  rawBody: string
  signature: string | null
  timestamp: string | null
  sharedSecret?: string | null
}) {
  const expectedSecret = getCallbackSecret()

  if (sharedSecret) {
    const provided = sharedSecret.trim()
    if (provided.length === expectedSecret.length) {
      if (
        crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expectedSecret))
      ) {
        return true
      }
    }
  }

  if (!signature || !timestamp) {
    return false
  }

  const expected = signCallbackBody(timestamp, rawBody)
  const actual = signature.trim().toLowerCase()
  const normalizedExpected = expected.trim().toLowerCase()

  if (actual.length !== normalizedExpected.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(normalizedExpected))
}

function buildInitialSnapshot(
  scenario: ScenarioRecord,
  workflowKey: string | undefined,
  requestPayload: Record<string, unknown> | undefined,
  runtimeMode: RuntimePersistenceMode,
): RuntimeSnapshot {
  const runId = crypto.randomUUID()
  const now = nowIso()
  const snapshot: RuntimeSnapshot = {
    run: {
      id: runId,
      scenarioKey: scenario.id,
      status: 'queued',
      startedAt: now,
      updatedAt: now,
      currentStep: 'queued',
      workflowKey,
      dispatchState: 'queued',
      runtimeMode,
      operatorMilestones: [],
      nodeStates: initialNodeStates(scenario),
      events: [],
    },
    dispatches: [],
    documentJobs: [],
  }

  appendEvent(snapshot, {
    stepKey: 'queued',
    label: 'Run created',
    detail:
      'The scenario run was persisted by the app service and queued for real n8n orchestration.',
    level: 'info',
    payload: requestPayload,
  })

  return snapshot
}

async function dispatchRunToN8n(
  snapshot: RuntimeSnapshot,
  scenario: ScenarioRecord,
  callbackBaseUrl: string,
  requestPayload?: Record<string, unknown>,
) {
  const catalog = await resolveWorkflowCatalog(scenario.id)
  const now = nowIso()
  const dispatchId = crypto.randomUUID()
  const document = defaultDocumentForScenario(scenario, requestPayload)
  const claimRequest = {
    line: catalog.token === 'fleet' ? 'fleet' : 'property',
    jurisdiction: 'DE',
    insured:
      catalog.token === 'fleet' ? 'Blackwood Logistics GmbH' : 'Meridian Warehousing GmbH',
  }

  snapshot.dispatches.push({
    id: dispatchId,
    workflowKey: catalog.orchestrator?.workflow_id || 'pending',
    webhookPath: catalog.orchestrator?.webhook_path || '',
    dispatchState: 'dispatching',
    requestPayload: claimRequest,
    createdAt: now,
    updatedAt: now,
  })
  snapshot.run.dispatchState = 'dispatching'
  snapshot.run.updatedAt = now
  await saveSnapshot(snapshot)

  try {
    const claimResponse = await callN8nWebhook<{
      ok?: boolean
      claimId?: string
      status?: string
      line?: string
      jurisdiction?: string
      policy?: string
      insured?: string
    }>('demo/claims', {
      body: claimRequest,
    })

    if (!claimResponse?.claimId) {
      throw new Error('n8n claims facade did not return a claim id')
    }

    snapshot.run.claimId = claimResponse.claimId
    snapshot.run.status = 'running'
    snapshot.run.currentStep = 'n8n-dispatched'
    snapshot.run.dispatchState = 'running'
    snapshot.run.updatedAt = nowIso()
    appendEvent(snapshot, {
      stepKey: 'claim-created',
      label: 'Claim created',
      detail: `Claims facade opened ${claimResponse.claimId} and handed the run to n8n.`,
      level: 'success',
      payload: claimResponse as Record<string, unknown>,
    })

    const dispatch = snapshot.dispatches.find((entry) => entry.id === dispatchId)
    if (dispatch) {
      dispatch.requestPayload = {
        ...claimRequest,
        claim_id: claimResponse.claimId,
      }
      dispatch.workflowKey = catalog.orchestrator?.workflow_id || dispatch.workflowKey
      dispatch.webhookPath = catalog.orchestrator?.webhook_path || dispatch.webhookPath
      dispatch.dispatchState = 'running'
      dispatch.updatedAt = nowIso()
    }

    await saveSnapshot(snapshot)

    if (!catalog.orchestrator) {
      throw new Error(`No active orchestrator workflow is registered for scenario ${scenario.id}`)
    }

    const orchestratorPayload = {
      run_id: snapshot.run.id,
      scenario_key: scenario.id,
      claim_id: claimResponse.claimId,
      callback_base_url: callbackBaseUrl,
      callback_secret: getCallbackSecret(),
      workflow_key: catalog.orchestrator.workflow_id,
      document,
      docs_webhook_path: catalog.docsWorkflow?.webhook_path || 'docs/ingest',
      n8n_webhook_base: `${getN8nBaseUrl()}/webhook`,
      synthetic_db_base: 'http://127.0.0.1:3001',
      mcp_tools: catalog.mcpTools,
      request_payload: requestPayload ?? {},
    }

    const orchestratorResponse = await callN8nWebhook<Record<string, unknown>>(
      catalog.orchestrator.webhook_path,
      {
        body: orchestratorPayload,
      },
    )

    const latestSnapshot = (await loadSnapshot(snapshot.run.id)) ?? snapshot
    const latestDispatch =
      latestSnapshot.dispatches.find((entry) => entry.id === dispatchId) ??
      latestSnapshot.dispatches.find((entry) => entry.workflowKey === catalog.orchestrator?.workflow_id)

    if (latestDispatch) {
      latestDispatch.responsePayload = orchestratorResponse
      latestDispatch.dispatchState = 'completed'
      latestDispatch.updatedAt = nowIso()
    }

    latestSnapshot.run.dispatchState = 'completed'
    latestSnapshot.run.updatedAt = nowIso()
    await saveSnapshot(latestSnapshot)
  } catch (error) {
    const failedSnapshot = (await loadSnapshot(snapshot.run.id)) ?? snapshot

    failedSnapshot.run.status = 'failed'
    failedSnapshot.run.dispatchState = 'failed'
    failedSnapshot.run.currentStep = 'dispatch-failed'
    failedSnapshot.run.finishedAt = nowIso()
    failedSnapshot.run.updatedAt = failedSnapshot.run.finishedAt
    appendEvent(failedSnapshot, {
      stepKey: 'dispatch-failed',
      label: 'Dispatch failed',
      detail: error instanceof Error ? error.message : 'Unknown n8n dispatch failure',
      level: 'error',
    })

    const failedDispatch =
      failedSnapshot.dispatches.find((entry) => entry.id === dispatchId) ??
      failedSnapshot.dispatches.find((entry) => entry.workflowKey === catalog.orchestrator?.workflow_id)

    if (failedDispatch) {
      failedDispatch.dispatchState = 'failed'
      failedDispatch.responsePayload = {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      failedDispatch.updatedAt = nowIso()
    }

    await saveSnapshot(failedSnapshot)
  }
}

export async function createRun(
  scenario: ScenarioRecord,
  options: StartRunOptions,
): Promise<ScenarioRun> {
  const catalog = await resolveWorkflowCatalog(scenario.id)
  const runtimeMode = await resolveRuntimeMode()
  const snapshot = buildInitialSnapshot(
    scenario,
    catalog.orchestrator?.workflow_id,
    options.requestPayload,
    runtimeMode,
  )

  await saveSnapshot(snapshot)

  void dispatchRunToN8n(snapshot, scenario, options.callbackBaseUrl, options.requestPayload)

  return structuredClone(snapshot.run)
}

export async function getRun(runId: string) {
  const snapshot = await loadSnapshot(runId)
  return snapshot ? structuredClone(snapshot.run) : null
}

export async function getRunSnapshot(runId: string) {
  const snapshot = await loadSnapshot(runId)
  return snapshot ? structuredClone(snapshot) : null
}

export async function ingestRunCallback(callback: IngestedCallback, statusOverride?: RunStatus) {
  const snapshot = await loadSnapshot(callback.run_id)

  if (!snapshot) {
    return null
  }

  updateRunWithCallback(snapshot, callback, statusOverride)
  await reconcileOperatorArtifacts(snapshot, callback)
  await saveSnapshot(snapshot)

  return structuredClone(snapshot.run)
}

export async function emitSyntheticFailure(runId: string, detail: string) {
  const snapshot = await loadSnapshot(runId)

  if (!snapshot) {
    return null
  }

  updateRunWithCallback(
    snapshot,
    {
      run_id: runId,
      step_key: 'failed',
      label: 'Run failed',
      detail,
      level: 'error',
      status: 'failed',
      current_step: 'failed',
    },
    'failed',
  )

  await saveSnapshot(snapshot)
  return structuredClone(snapshot.run)
}
