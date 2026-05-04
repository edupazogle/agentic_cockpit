'use client'

import {
  Background,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  FileText,
  MessageSquare,
  Network,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'

import { nodeTypes } from '@/components/flow/node-types'
import type {
  ActivityEntry,
  FlowNodeDefinition,
  McpInvocation,
  NodeStatus,
  ScenarioRecord,
  ScenarioRun,
  ScenarioRunEvent,
} from '@/lib/domain/types'

const projectTabs = [
  { label: 'Architecture', icon: Network, active: true },
  { label: 'Observability', icon: BarChart3 },
  { label: 'Logs', icon: FileText },
  { label: 'Settings', icon: Settings },
]

function buildNodes(
  scenarioNodes: FlowNodeDefinition[],
  scenarioStages: ScenarioRecord['stages'],
  liveMode: boolean,
  activeRun: ScenarioRun | null,
): Node[] {
  const stageNodes: Node[] = scenarioStages.map((stage) => ({
    id: stage.id,
    type: 'stageGroup',
    position: { x: stage.x, y: stage.y },
    data: { ...stage } as Record<string, unknown>,
    selectable: false,
    draggable: false,
    connectable: false,
    style: {
      width: stage.width,
      height: stage.height,
      background: 'transparent',
      border: 'none',
    },
  }))

  const serviceNodes: Node[] = scenarioNodes.map((node) => {
    const resolvedStatus: NodeStatus =
      activeRun?.nodeStates[node.id] ??
      (liveMode && node.liveStatus ? node.liveStatus : node.status)

    return {
      id: node.id,
      type: node.kind === 'endpoint' ? 'endpointCard' : 'agentCard',
      position: { x: node.x, y: node.y },
      parentId: node.parentId,
      extent: node.parentId ? 'parent' : undefined,
      draggable: false,
      data: {
        ...node,
        resolvedStatus,
      } as Record<string, unknown>,
      style: {
        width: node.width,
        height: node.height,
      },
    }
  })

  return [...stageNodes, ...serviceNodes]
}

function buildEdges(
  scenarioEdges: ScenarioRecord['edges'],
  liveMode: boolean,
): Edge[] {
  return scenarioEdges.map((edge) => {
    const active = liveMode && edge.live

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: active,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: active ? 'rgba(165, 139, 255, 0.8)' : 'rgba(140, 132, 168, 0.45)',
        width: 18,
        height: 18,
      },
      style: {
        stroke: active ? 'rgba(165, 139, 255, 0.72)' : 'rgba(140, 132, 168, 0.3)',
        strokeWidth: active ? 1.8 : 1.4,
      },
    }
  })
}

function formatTimestamp(value?: string) {
  if (!value) return 'Live'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Live'
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function truncateText(value: string, maxLength = 180) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function stringifyValue(value: unknown, maxLength = 180) {
  if (value == null) return null
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return truncateText(text, maxLength)
}

function eventTone(entry: ScenarioRunEvent) {
  if (entry.level === 'error') return 'review'
  if (entry.level === 'warning') return 'review'
  if (entry.level === 'success') return 'ready'
  return 'running'
}

function isRunEvent(entry: ScenarioRunEvent | ActivityEntry): entry is ScenarioRunEvent {
  return 'runId' in entry
}

function getEventResponse(entry: ScenarioRunEvent) {
  const payload = entry.payload
  if (!payload) return null

  if (payload.document_job?.summary) {
    return payload.document_job.summary
  }

  if (payload.response_payload?.summary && typeof payload.response_payload.summary === 'string') {
    return payload.response_payload.summary
  }

  if (payload.response_payload) {
    return stringifyValue(payload.response_payload)
  }

  return null
}

function getEventMcpInvocations(entry: ScenarioRunEvent): McpInvocation[] {
  return entry.payload?.mcp_invocations ?? []
}

function getSelectedNodeStatus(
  selectedNode: FlowNodeDefinition | undefined,
  activeRun: ScenarioRun | null,
) {
  if (!selectedNode) return null
  return activeRun?.nodeStates[selectedNode.id] ?? selectedNode.status
}

interface ScenarioWorkspaceProps {
  scenario: ScenarioRecord
}

export function ScenarioWorkspace({ scenario }: ScenarioWorkspaceProps) {
  const [showActivity, setShowActivity] = useState(true)
  const [liveMode, setLiveMode] = useState(scenario.status === 'running')
  const [activeRun, setActiveRun] = useState<ScenarioRun | null>(null)
  const [isStartingRun, setIsStartingRun] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    scenario.nodes.find((node) => node.kind === 'agent')?.id ?? null,
  )

  const handleRunSnapshot = useEffectEvent((snapshot: ScenarioRun) => {
    startTransition(() => {
      setActiveRun(snapshot)
      setLiveMode(true)
    })
  })

  useEffect(() => {
    if (!activeRun?.id) {
      return
    }

    const source = new EventSource(`/api/runs/${activeRun.id}/stream`)

    source.addEventListener('snapshot', (event) => {
      handleRunSnapshot(JSON.parse(event.data) as ScenarioRun)
    })

    source.onerror = () => {
      source.close()
    }

    return () => {
      source.close()
    }
  }, [activeRun?.id, handleRunSnapshot])

  const nodes = useMemo(() => {
    return buildNodes(scenario.nodes, scenario.stages, liveMode, activeRun)
  }, [activeRun, liveMode, scenario.nodes, scenario.stages])

  const edges = useMemo(() => {
    return buildEdges(scenario.edges, liveMode)
  }, [liveMode, scenario.edges])

  const selectedNode = scenario.nodes.find((node) => node.id === selectedNodeId) ?? scenario.nodes[0]
  const selectedNodeStatus = getSelectedNodeStatus(selectedNode, activeRun)
  const activity = activeRun?.events.length ? activeRun.events.slice().reverse() : scenario.activity

  async function startRun() {
    setIsStartingRun(true)
    setError(null)

    try {
      const response = await fetch(`/api/scenarios/${scenario.id}/runs`, { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Failed to start scenario run: HTTP ${response.status}`)
      }
      const payload = (await response.json()) as { run: ScenarioRun }
      setActiveRun(payload.run)
      setLiveMode(true)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to start run')
    } finally {
      setIsStartingRun(false)
    }
  }

  return (
    <div className="metro-shell">
      <header className="metro-header">
        <div className="metro-header-left">
          <Link className="metro-breadcrumb" href="/">
            <ChevronLeft size={16} />
            <span>{scenario.team}</span>
          </Link>
          <span className="metro-header-divider" />
          <div className="metro-project-name">{scenario.title}</div>
        </div>
        <div className="metro-header-actions">
          <button
            className="secondary-button secondary-button--compact"
            type="button"
            onClick={() => setShowActivity((value) => !value)}
          >
            <Activity size={14} />
            <span>Activity</span>
          </button>
          <button
            className="secondary-button secondary-button--compact"
            type="button"
            onClick={() => setLiveMode(true)}
          >
            Launch live
          </button>
          <button
            className="primary-button primary-button--compact"
            type="button"
            onClick={startRun}
            disabled={isStartingRun}
          >
            {isStartingRun ? 'Starting…' : 'Run wired'}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setActiveRun(null)
              setLiveMode(false)
              setError(null)
            }}
          >
            Reset
          </button>
          <button className="ghost-icon-button" type="button" aria-label="Notifications">
            <Bell size={15} />
          </button>
        </div>
      </header>

      <div className="metro-body">
        <nav className="metro-nav" aria-label="Scenario sections">
          {projectTabs.map((tab) => (
            <button
              key={tab.label}
              className={`metro-nav-item ${tab.active ? 'is-active' : ''}`}
              type="button"
            >
              <tab.icon size={16} />
              <span className="sr-only">{tab.label}</span>
            </button>
          ))}
          <div className="metro-nav-spacer" />
          <button className="metro-nav-item" type="button">
            <MessageSquare size={16} />
            <span className="sr-only">Agent</span>
          </button>
        </nav>

        <div className="metro-content">
          <div className="metro-canvas-wrap">
            {error ? <div className="run-banner run-banner--error">{error}</div> : null}
            {activeRun ? (
              <div className="run-banner">
                <span
                  className={`status-pill status-pill--${
                    activeRun.status === 'completed'
                      ? 'ready'
                      : activeRun.status === 'waiting'
                        ? 'review'
                        : 'running'
                  }`}
                >
                  {activeRun.status}
                </span>
                <span>{activeRun.claimId ?? 'Claim pending'}</span>
                <span>·</span>
                <span>{activeRun.currentStep ?? 'queued'}</span>
                {activeRun.vendorName ? (
                  <>
                    <span>·</span>
                    <span>{activeRun.vendorName}</span>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="metro-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                fitView
                fitViewOptions={{ padding: 0.12 }}
                minZoom={0.45}
                maxZoom={1.4}
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              >
                <Background color="rgba(148, 136, 180, 0.24)" gap={14} size={1.1} />
              </ReactFlow>
            </div>

            <div className="live-dock">
              <div className="live-dock-copy">
                <div className="live-dock-eyebrow">{scenario.dockLabel}</div>
                <div className="live-dock-title">{scenario.title}</div>
              </div>
              <div className="live-dock-actions">
                <button className="dock-button" type="button">
                  Supabase
                </button>
                <button className="dock-button dock-button--solid" type="button">
                  Expand
                </button>
              </div>
            </div>
          </div>

          {showActivity ? (
            <aside className="metro-sidepanel">
              <div className="sidepanel-section">
                <div className="sidepanel-eyebrow">Scenario</div>
                <h2>{scenario.title}</h2>
                <p>{scenario.detailSummary}</p>
              </div>

              <div className="sidepanel-grid">
                <div className="sidepanel-metric">
                  <span>Agents</span>
                  <strong>{scenario.agents}</strong>
                </div>
                <div className="sidepanel-metric">
                  <span>MCPs</span>
                  <strong>{scenario.mcps}</strong>
                </div>
                <div className="sidepanel-metric">
                  <span>Flows</span>
                  <strong>{scenario.workflows}</strong>
                </div>
                <div className="sidepanel-metric">
                  <span>Run status</span>
                  <strong>{activeRun?.status ?? scenario.status}</strong>
                </div>
              </div>

              {activeRun ? (
                <div className="selection-card">
                  <div className="sidepanel-eyebrow">Operator Context</div>
                  <div className="selection-grid">
                    <div className="selection-grid-item">
                      <span>Claim</span>
                      <strong>{activeRun.claimId ?? 'Pending'}</strong>
                    </div>
                    <div className="selection-grid-item">
                      <span>Approval</span>
                      <strong>{activeRun.approvalId ?? 'Not opened'}</strong>
                    </div>
                    <div className="selection-grid-item">
                      <span>Reserve</span>
                      <strong>
                        {typeof activeRun.reserveEUR === 'number'
                          ? `EUR ${activeRun.reserveEUR.toFixed(0)}`
                          : 'Pending'}
                      </strong>
                    </div>
                    <div className="selection-grid-item">
                      <span>Vendor</span>
                      <strong>{activeRun.vendorName ?? 'Pending'}</strong>
                    </div>
                    <div className="selection-grid-item">
                      <span>Workflow</span>
                      <strong>{activeRun.workflowKey ?? 'Unmapped'}</strong>
                    </div>
                    <div className="selection-grid-item">
                      <span>Runtime</span>
                      <strong>{activeRun.runtimeMode ?? 'storage'}</strong>
                    </div>
                  </div>
                  <div className="selection-links">
                    {activeRun.chatThread ? (
                      <a
                        className="selection-link"
                        href={activeRun.chatThread.dashboardUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Chatwoot thread
                      </a>
                    ) : (
                      <span className="selection-link selection-link--muted">Chatwoot thread pending</span>
                    )}
                    {activeRun.dossierUrl ? (
                      <a
                        className="selection-link"
                        href={activeRun.dossierUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open dossier PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="selection-card">
                <div className="sidepanel-eyebrow">Selection</div>
                <div className="selection-card-title">{selectedNode?.title}</div>
                <div className="selection-card-subtitle">{selectedNode?.subtitle}</div>
                <div className="selection-chip-row">
                  {selectedNodeStatus ? (
                    <span className={`status-pill status-pill--${selectedNodeStatus === 'review' ? 'review' : selectedNodeStatus === 'ready' ? 'ready' : 'running'}`}>
                      {selectedNodeStatus}
                    </span>
                  ) : null}
                  {selectedNode?.metrics?.map((metric) => (
                    <span className="activity-badge" key={metric}>
                      {metric}
                    </span>
                  ))}
                </div>
                <p>{selectedNode?.description}</p>
              </div>

              <div className="selection-card">
                <div className="sidepanel-eyebrow">Data Source</div>
                <div className="selection-card-title">External Supabase + app-owned runtime</div>
                <div className="selection-card-subtitle">Scenarios from Supabase, runs from the app API</div>
                <p>
                  Scenario topology loads from `cockpit_scenarios` and `v_cockpit_scenario_config`,
                  while operator threads, run events, dossier links, and node states are persisted by
                  the `agentic` runtime.
                </p>
              </div>

              <div className="sidepanel-section">
                <div className="sidepanel-eyebrow">Activity</div>
                <div className="activity-list">
                  {activity.map((entry) =>
                    isRunEvent(entry) ? (
                      <div className="activity-item" key={entry.id}>
                        <div className="activity-item-top">
                          <div className="activity-item-heading">
                            <span>{entry.label}</span>
                            {entry.nodeId ? (
                              <span className="activity-node-label">{entry.nodeId}</span>
                            ) : null}
                          </div>
                          <time>{formatTimestamp(entry.createdAt)}</time>
                        </div>
                        <div className="selection-chip-row">
                          <span className={`status-pill status-pill--${eventTone(entry)}`}>
                            {entry.level}
                          </span>
                          {getEventMcpInvocations(entry).map((invocation, index) => (
                            <span className="activity-badge activity-badge--mcp" key={`${entry.id}-${invocation.tool_name}-${index}`}>
                              {invocation.mcp_domain}.{invocation.tool_name}
                            </span>
                          ))}
                          {entry.payload?.document_job ? (
                            <span className="activity-badge activity-badge--doc">
                              {entry.payload.document_job.status}
                              {entry.payload.document_job.doc_type
                                ? ` · ${entry.payload.document_job.doc_type}`
                                : ''}
                            </span>
                          ) : null}
                        </div>
                        <p>{entry.detail}</p>
                        {getEventResponse(entry) ? (
                          <div className="activity-response">{getEventResponse(entry)}</div>
                        ) : null}
                        <div className="activity-links">
                          {entry.payload?.chatwoot ? (
                            <a
                              className="selection-link"
                              href={entry.payload.chatwoot.dashboard_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Chatwoot conversation {entry.payload.chatwoot.conversation_id}
                            </a>
                          ) : null}
                          {entry.payload?.dossier ? (
                            <a
                              className="selection-link"
                              href={entry.payload.dossier.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open dossier PDF
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="activity-item" key={entry.id}>
                        <div className="activity-item-top">
                          <span>{entry.label}</span>
                          <time>{entry.time}</time>
                        </div>
                        <p>{entry.detail}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  )
}
