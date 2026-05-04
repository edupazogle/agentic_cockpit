export type AccentTone = 'violet' | 'blue' | 'orange' | 'green' | 'cyan'

export type NodeStatus = 'inactive' | 'ready' | 'running' | 'review'

export type ScenarioStatus = 'ready' | 'running' | 'review'

export type RunStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed'

export type RunEventLevel = 'info' | 'warning' | 'error' | 'success'

export type IconKey =
  | 'phone'
  | 'shield'
  | 'brain'
  | 'file'
  | 'sparkles'
  | 'wrench'
  | 'user'
  | 'tower'
  | 'truck'
  | 'bot'
  | 'database'
  | 'activity'

export interface PreviewService {
  id: string
  label: string
  icon: IconKey
  accent: AccentTone
}

export interface StageDefinition {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
}

export interface FlowEdgeDefinition {
  id: string
  source: string
  target: string
  live?: boolean
}

export interface FlowNodeDefinition {
  id: string
  kind: 'agent' | 'endpoint'
  title: string
  subtitle: string
  description: string
  icon: IconKey
  accent: AccentTone
  status: NodeStatus
  liveStatus?: NodeStatus
  x: number
  y: number
  width: number
  height: number
  parentId?: string
  metrics?: [string, string, string]
}

export interface ActivityEntry {
  id: string
  label: string
  detail: string
  time: string
}

export interface ScenarioRecord {
  id: string
  team: string
  title: string
  status: ScenarioStatus
  environment: string
  description: string
  updatedLabel: string
  agents: number
  mcps: number
  workflows: number
  servicesOnline: number
  totalServices: number
  previewServices: PreviewService[]
  stages: StageDefinition[]
  nodes: FlowNodeDefinition[]
  edges: FlowEdgeDefinition[]
  activity: ActivityEntry[]
  dockLabel: string
  detailSummary: string
}

export interface ScenarioRunEvent {
  id: string
  runId: string
  scenarioKey: string
  stepKey: string
  label: string
  detail: string
  nodeId?: string
  level: RunEventLevel
  createdAt: string
  payload?: ScenarioRunEventPayload
}

export interface McpInvocation {
  mcp_domain: string
  tool_name: string
  args?: Record<string, unknown>
  result?: unknown
  ok?: boolean
  retryable?: boolean
  trace_id?: string
}

export interface ScenarioRunEventPayload {
  request_payload?: Record<string, unknown>
  response_payload?: Record<string, unknown>
  mcp_invocations?: McpInvocation[]
  document_job?: {
    id?: string
    status: string
    document_url?: string
    filename?: string
    mime_type?: string
    doc_type?: string
    summary?: string
  }
  chatwoot?: {
    conversation_id: string | number
    dashboard_url: string
  }
  dossier?: {
    url: string
  }
  [key: string]: unknown
}

export interface ScenarioRunChatThread {
  conversationId: string | number
  dashboardUrl: string
}

export interface ScenarioRun {
  id: string
  scenarioKey: string
  status: RunStatus
  startedAt: string
  updatedAt?: string
  finishedAt?: string
  currentStep?: string
  claimId?: string
  approvalId?: string
  vendorName?: string
  reserveEUR?: number
  workflowKey?: string
  dispatchState?: string
  runtimeMode?: 'tables' | 'storage'
  documentJob?: {
    id?: string
    status: string
    documentUrl?: string
    docType?: string
    summary?: string
  }
  chatThread?: ScenarioRunChatThread
  dossierUrl?: string
  lastMcpInvocation?: McpInvocation
  operatorMilestones?: string[]
  nodeStates: Record<string, NodeStatus>
  events: ScenarioRunEvent[]
}
