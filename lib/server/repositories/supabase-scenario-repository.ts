import type {
  AccentTone,
  ActivityEntry,
  FlowNodeDefinition,
  IconKey,
  PreviewService,
  ScenarioRecord,
  ScenarioStatus,
  StageDefinition,
} from '@/lib/domain/types'
import { supabaseSelect } from '@/lib/server/integrations/supabase'
import type { ScenarioRepository } from '@/lib/server/repositories/scenario-repository'

interface SupabaseScenarioRow {
  key: string
  label: string
  description: string | null
  icon: string | null
  url_path: string | null
  active: boolean
}

interface SupabaseScenarioMember {
  member_id: string
  name: string
  row_type: string
  phase_key: string
  icon: string | null
  mission: string | null
  category: string | null
  tier: number | null
  cost_per_beat: number | string | null
  agent_role?: string | null
  workflow_id?: string | null
}

interface SupabaseScenarioConfigRow extends SupabaseScenarioRow {
  members: SupabaseScenarioMember[] | null
  layout_rows: unknown
  layout_phases: unknown
}

const scenarioStatusMap: Record<string, ScenarioStatus> = {
  property: 'ready',
  fleet: 'running',
}

const scenarioIdMap: Record<string, string> = {
  property: 'property-fast-track',
  fleet: 'motor-fleet',
}

const scenarioEnvironmentMap: Record<string, string> = {
  property: 'production',
  fleet: 'production',
}

const stageTitleMap: Record<string, Record<string, string>> = {
  property: {
    intake: '01 · Notify · FNOL · intake',
    triage: '02 · Triage · severity · reserves',
    evidence: '03 · Docs · evidence · enrichment',
    fulfillment: '04 · Dispatch · vendor · booking',
  },
  fleet: {
    intake: '01 · Intake · telematics',
    triage: '02 · Triage · severity · repair',
    evidence: '03 · Evidence · dossier · review',
    fulfillment: '04 · Dispatch · shop · booking',
  },
}

const stageGeometry: Record<string, Array<Omit<StageDefinition, 'id' | 'title'>>> = {
  property: [
    { x: 336, y: 214, width: 286, height: 242 },
    { x: 660, y: 118, width: 302, height: 430 },
    { x: 1000, y: 98, width: 286, height: 328 },
    { x: 1318, y: 126, width: 324, height: 392 },
  ],
  fleet: [
    { x: 336, y: 214, width: 286, height: 242 },
    { x: 660, y: 118, width: 302, height: 338 },
    { x: 1000, y: 120, width: 286, height: 328 },
    { x: 1318, y: 126, width: 324, height: 316 },
  ],
}

const propertyStages: StageDefinition[] = [
  { id: 'notify', title: '01 · Notify · FNOL · intake', x: 336, y: 214, width: 286, height: 242 },
  { id: 'triage', title: '02 · Triage · severity · reserves', x: 660, y: 118, width: 302, height: 430 },
  { id: 'docs', title: '03 · Docs · evidence · enrichment', x: 1000, y: 98, width: 286, height: 268 },
  { id: 'dispatch', title: '04 · Dispatch · vendor · booking', x: 1318, y: 126, width: 324, height: 392 },
]

const fleetStages: StageDefinition[] = [
  { id: 'fleet-intake', title: '01 · Intake · telematics', x: 340, y: 182, width: 288, height: 228 },
  { id: 'fleet-triage', title: '02 · Damage · repair gate', x: 670, y: 122, width: 302, height: 338 },
  { id: 'fleet-dispatch', title: '03 · Body shop · dispatch', x: 1022, y: 148, width: 320, height: 298 },
]

function toAccent(rowType: string, memberId: string): AccentTone {
  if (memberId.includes('vendor') || memberId.includes('repair')) return 'green'
  if (rowType === 'voice') return 'violet'
  if (rowType === 'claw') return 'blue'
  if (rowType === 'handler') return 'orange'
  if (rowType === 'mcp') return 'cyan'
  if (rowType === 'human') return 'green'
  return 'blue'
}

function toIcon(icon: string | null, rowType: string, memberId: string): IconKey {
  const normalized = String(icon || '').toLowerCase()

  if (normalized.includes('phone')) return 'phone'
  if (normalized.includes('spark')) return 'sparkles'
  if (normalized.includes('file')) return 'file'
  if (normalized.includes('database')) return 'database'
  if (normalized.includes('shield')) return 'shield'
  if (normalized.includes('workflow') || normalized.includes('zap')) return 'shield'
  if (normalized.includes('wrench')) return 'wrench'
  if (normalized.includes('truck')) return 'truck'
  if (normalized.includes('headset')) return memberId.includes('vendor') ? 'tower' : 'sparkles'
  if (normalized.includes('user')) return 'user'
  if (memberId.includes('vendor')) return 'tower'
  if (rowType === 'mcp') return 'database'
  if (rowType === 'voice') return 'phone'
  if (rowType === 'handler') return 'sparkles'
  if (rowType === 'human') return 'user'
  return 'bot'
}

function metricValue(costPerBeat: number | string | null, tier: number | null) {
  const amount = typeof costPerBeat === 'number' ? costPerBeat : Number(costPerBeat || 0)
  const duration = `${4 + (tier || 1) * 2}s`
  return [`€${amount.toFixed(2)}`, `t${tier || 1}`, duration] as [string, string, string]
}

function createStageDefinitions(scenarioKey: string, members: SupabaseScenarioMember[]): StageDefinition[] {
  const phases = ['intake', 'triage', 'evidence', 'fulfillment'].filter((phase) =>
    members.some((member) => member.phase_key === phase && !isEndpointMember(member)),
  )

  const titles = stageTitleMap[scenarioKey] ?? stageTitleMap.property
  const geometry = stageGeometry[scenarioKey] ?? stageGeometry.property

  return phases.map((phase, index) => ({
    id: phase,
    title: titles[phase] ?? phase,
    ...geometry[index],
  }))
}

function isLeftEndpoint(member: SupabaseScenarioMember) {
  return member.row_type === 'human' && (member.phase_key === 'intake' || member.member_id.includes('driver'))
}

function isRightEndpoint(member: SupabaseScenarioMember) {
  return member.row_type === 'human' && (member.member_id.includes('vendor') || member.member_id.includes('repair'))
}

function isEndpointMember(member: SupabaseScenarioMember) {
  return isLeftEndpoint(member) || isRightEndpoint(member)
}

function endpointPosition(member: SupabaseScenarioMember) {
  if (isLeftEndpoint(member)) {
    return { x: 20, y: 260, width: 220, height: 136 }
  }

  return { x: 1720, y: 258, width: 232, height: 136 }
}

function agentLayoutInStage(members: SupabaseScenarioMember[], stageId: string) {
  const stageMembers = members.filter((member) => member.phase_key === stageId && !isEndpointMember(member))

  return stageMembers.map((member, index) => {
    const row = Math.floor(index / 2)
    const column = index % 2
    const width = stageId === 'dispatch' || stageId === 'fulfillment' ? 272 : 248
    const x = column === 0 ? 24 : width + 38
    const y = 46 + row * 150

    return { member, x, y, width, height: 126 }
  })
}

function memberDescription(member: SupabaseScenarioMember) {
  return member.mission || member.category || 'Scenario member'
}

function memberById(members: SupabaseScenarioMember[], memberId: string) {
  return members.find((member) => member.member_id === memberId)
}

function fallbackMember(memberId: string): SupabaseScenarioMember {
  return {
    member_id: memberId,
    name: memberId,
    row_type: 'ai',
    phase_key: 'triage',
    icon: null,
    mission: 'Scenario member',
    category: 'Mapped from Supabase',
    tier: 1,
    cost_per_beat: 0,
  }
}

function makeAgentNode(
  id: string,
  member: SupabaseScenarioMember,
  overrides: Partial<FlowNodeDefinition>,
): FlowNodeDefinition {
  return {
    id,
    kind: 'agent',
    title: member.name,
    subtitle: member.category || `${member.row_type} · ${member.phase_key}`,
    description: memberDescription(member),
    icon: toIcon(member.icon, member.row_type, member.member_id),
    accent: toAccent(member.row_type, member.member_id),
    status: 'inactive',
    liveStatus: 'ready',
    x: 0,
    y: 0,
    width: 248,
    height: 126,
    metrics: metricValue(member.cost_per_beat, member.tier),
    ...overrides,
  }
}

function makeEndpointNode(
  id: string,
  member: SupabaseScenarioMember,
  overrides: Partial<FlowNodeDefinition>,
): FlowNodeDefinition {
  return {
    id,
    kind: 'endpoint',
    title: member.name,
    subtitle: member.category || 'Operator side',
    description: memberDescription(member),
    icon: toIcon(member.icon, member.row_type, member.member_id),
    accent: 'green',
    status: 'ready',
    liveStatus: 'ready',
    x: 0,
    y: 0,
    width: 220,
    height: 136,
    ...overrides,
  }
}

function buildPropertyScenario(config: SupabaseScenarioConfigRow): ScenarioRecord {
  const members = config.members ?? []
  const policyholder = memberById(members, 'human_policyholder') ?? fallbackMember('human_policyholder')
  const vendor = memberById(members, 'human_vendor') ?? fallbackMember('human_vendor')
  const intake = memberById(members, 'ai_intake') ?? fallbackMember('ai_intake')
  const triage = memberById(members, 'ai_property_triage') ?? memberById(members, 'ai_orchestrator') ?? fallbackMember('ai_property_triage')
  const reserve = memberById(members, 'ai_orchestrator') ?? fallbackMember('ai_orchestrator')
  const docCheck = memberById(members, 'claw_nemoclaw') ?? fallbackMember('claw_nemoclaw')
  const review = memberById(members, 'handler_hermes') ?? fallbackMember('handler_hermes')
  const adjuster = memberById(members, 'ai_adjuster_copilot') ?? fallbackMember('ai_adjuster_copilot')
  const outreach = memberById(members, 'ai_property_vendor') ?? fallbackMember('ai_property_vendor')

  const nodes: FlowNodeDefinition[] = [
    makeEndpointNode('presenter', policyholder, {
      title: 'Presenter',
      subtitle: 'Insured side',
      x: 20,
      y: 260,
      width: 220,
      height: 136,
    }),
    makeEndpointNode('vendor-endpoint', vendor, {
      x: 1720,
      y: 258,
      width: 232,
      height: 136,
    }),
    makeAgentNode('notify-intake', intake, {
      parentId: 'notify',
      x: 22,
      y: 60,
      width: 242,
      height: 132,
      liveStatus: 'running',
    }),
    makeAgentNode('atlas-triage', triage, {
      title: 'Atlas · Triage Module',
      parentId: 'triage',
      x: 24,
      y: 42,
      width: 248,
      height: 138,
      liveStatus: 'ready',
    }),
    makeAgentNode('reserve-gate', reserve, {
      title: 'Rachel · Reserve Gate',
      subtitle: 'Human approval · reserve threshold',
      parentId: 'triage',
      x: 24,
      y: 210,
      width: 248,
      height: 128,
      icon: 'brain',
      accent: 'violet',
      liveStatus: 'review',
    }),
    makeAgentNode('doc-check', docCheck, {
      title: 'NemoClaw · Doc Check',
      parentId: 'docs',
      x: 24,
      y: 40,
      width: 238,
      height: 126,
      liveStatus: 'ready',
    }),
    makeAgentNode('human-review', review, {
      title: 'Hermes · Handler Copilot',
      parentId: 'docs',
      x: 24,
      y: 186,
      width: 238,
      height: 126,
      liveStatus: 'review',
    }),
    makeAgentNode('adjuster', adjuster, {
      title: 'Adjuster Copilot',
      parentId: 'dispatch',
      x: 24,
      y: 52,
      width: 272,
      height: 130,
      accent: 'orange',
      icon: 'wrench',
      liveStatus: 'review',
    }),
    makeAgentNode('vendor-outreach', outreach, {
      title: 'Harry · Vendor Outreach',
      parentId: 'dispatch',
      x: 24,
      y: 214,
      width: 272,
      height: 118,
      liveStatus: 'ready',
    }),
  ]

  return {
    id: 'property-fast-track',
    team: 'Teams',
    title: config.label,
    status: 'ready',
    environment: 'production',
    description: config.description || `${config.label} loaded from Supabase scenario registry.`,
    updatedLabel: 'Synced from Supabase scenario registry',
    agents: members.filter((member) => member.row_type !== 'mcp' && member.row_type !== 'human').length,
    mcps: members.filter((member) => member.row_type === 'mcp').length,
    workflows: members.filter((member) => member.row_type === 'ai' || member.row_type === 'handler' || member.row_type === 'claw').length,
    servicesOnline: members.length,
    totalServices: members.length,
    previewServices: toPreviewServices(nodes),
    stages: propertyStages,
    nodes,
    edges: [
      { id: 'e1', source: 'presenter', target: 'notify-intake', live: true },
      { id: 'e2', source: 'notify-intake', target: 'atlas-triage', live: true },
      { id: 'e3', source: 'atlas-triage', target: 'reserve-gate', live: true },
      { id: 'e4', source: 'reserve-gate', target: 'doc-check', live: true },
      { id: 'e5', source: 'doc-check', target: 'human-review', live: true },
      { id: 'e6', source: 'human-review', target: 'adjuster', live: true },
      { id: 'e7', source: 'adjuster', target: 'vendor-outreach', live: true },
      { id: 'e8', source: 'vendor-outreach', target: 'vendor-endpoint', live: true },
    ],
    activity: [
      {
        id: 'a1',
        label: 'Supabase registry loaded',
        detail: `${members.length} scenario members were resolved into the flagship Property Fast-Track workspace.`,
        time: 'Now',
      },
      {
        id: 'a2',
        label: 'Reserve gate armed',
        detail: reserve.mission || 'Reserve approval is waiting on human review after triage severity exceeded threshold.',
        time: 'Now',
      },
      {
        id: 'a3',
        label: 'Dispatch ready',
        detail: outreach.mission || 'Vendor outreach is staged with Northside Dispatch and the slot recommendation payload.',
        time: 'Now',
      },
    ],
    dockLabel: 'LIVE MCP CONTROL',
    detailSummary: `${config.label} is sourced from your Supabase scenario tables and rendered with the curated flagship workspace layout.`,
  }
}

function buildFleetScenario(config: SupabaseScenarioConfigRow): ScenarioRecord {
  const members = config.members ?? []
  const driver = memberById(members, 'human_driver') ?? fallbackMember('human_driver')
  const shop = memberById(members, 'human_repair') ?? fallbackMember('human_repair')
  const intake = memberById(members, 'ai_intake') ?? fallbackMember('ai_intake')
  const atlas = memberById(members, 'ai_fleet_triage') ?? memberById(members, 'ai_orchestrator') ?? fallbackMember('ai_fleet_triage')
  const review = memberById(members, 'handler_hermes') ?? fallbackMember('handler_hermes')
  const dispatch = memberById(members, 'ai_fleet_vendor') ?? fallbackMember('ai_fleet_vendor')

  const nodes: FlowNodeDefinition[] = [
    makeEndpointNode('fleet-driver', driver, {
      subtitle: 'Telematics side',
      x: 28,
      y: 248,
      width: 220,
      height: 136,
    }),
    makeEndpointNode('fleet-shop', shop, {
      title: 'Preferred Body Shop',
      x: 1410,
      y: 248,
      width: 232,
      height: 136,
    }),
    makeAgentNode('fleet-rachel', intake, {
      parentId: 'fleet-intake',
      x: 24,
      y: 54,
      width: 244,
      height: 126,
      liveStatus: 'running',
    }),
    makeAgentNode('fleet-atlas', atlas, {
      title: 'Atlas · Collision Scoring',
      parentId: 'fleet-triage',
      x: 24,
      y: 48,
      width: 248,
      height: 126,
      liveStatus: 'ready',
    }),
    makeAgentNode('fleet-review', review, {
      title: 'Hermes · Repair Approval',
      parentId: 'fleet-triage',
      x: 24,
      y: 198,
      width: 248,
      height: 112,
      accent: 'orange',
      liveStatus: 'review',
    }),
    makeAgentNode('fleet-liam', dispatch, {
      title: 'Liam · Repair Dispatch',
      parentId: 'fleet-dispatch',
      x: 24,
      y: 62,
      width: 272,
      height: 126,
      accent: 'green',
      icon: 'truck',
      liveStatus: 'running',
    }),
  ]

  return {
    id: 'motor-fleet',
    team: 'Teams',
    title: config.label,
    status: 'running',
    environment: 'production',
    description: config.description || `${config.label} loaded from Supabase scenario registry.`,
    updatedLabel: 'Synced from Supabase scenario registry',
    agents: members.filter((member) => member.row_type !== 'mcp' && member.row_type !== 'human').length,
    mcps: members.filter((member) => member.row_type === 'mcp').length,
    workflows: members.filter((member) => member.row_type === 'ai' || member.row_type === 'handler' || member.row_type === 'claw').length,
    servicesOnline: members.length,
    totalServices: members.length,
    previewServices: toPreviewServices(nodes),
    stages: fleetStages,
    nodes,
    edges: [
      { id: 'f1', source: 'fleet-driver', target: 'fleet-rachel', live: true },
      { id: 'f2', source: 'fleet-rachel', target: 'fleet-atlas', live: true },
      { id: 'f3', source: 'fleet-atlas', target: 'fleet-review', live: true },
      { id: 'f4', source: 'fleet-review', target: 'fleet-liam', live: true },
      { id: 'f5', source: 'fleet-liam', target: 'fleet-shop', live: true },
    ],
    activity: [
      {
        id: 'f-a1',
        label: 'Supabase registry loaded',
        detail: `${members.length} scenario members were condensed into the flagship Motor Fleet workspace.`,
        time: 'Now',
      },
      {
        id: 'f-a2',
        label: 'Repair approval pending',
        detail: review.mission || 'Hermes has the recommended reserve and selected partner.',
        time: 'Now',
      },
    ],
    dockLabel: 'LIVE FLEET CONTROL',
    detailSummary: `${config.label} is sourced from your Supabase scenario tables and rendered with the curated fleet workspace layout.`,
  }
}

function toFlowNodes(scenarioKey: string, members: SupabaseScenarioMember[]): FlowNodeDefinition[] {
  const nodes: FlowNodeDefinition[] = []

  members
    .filter(isEndpointMember)
    .forEach((member) => {
      const position = endpointPosition(member)
      nodes.push({
        id: member.member_id,
        kind: 'endpoint',
        title: member.name,
        subtitle: member.category || (isLeftEndpoint(member) ? 'Insured side' : 'Vendor side'),
        description: memberDescription(member),
        icon: toIcon(member.icon, member.row_type, member.member_id),
        accent: 'green',
        status: 'ready',
        liveStatus: 'ready',
        ...position,
      })
    })

  ;['intake', 'triage', 'evidence', 'fulfillment'].forEach((stageId) => {
    agentLayoutInStage(members, stageId).forEach(({ member, ...layout }) => {
      nodes.push({
        id: member.member_id,
        kind: 'agent',
        title: member.name,
        subtitle: member.category || `${member.row_type} · ${stageId}`,
        description: memberDescription(member),
        icon: toIcon(member.icon, member.row_type, member.member_id),
        accent: toAccent(member.row_type, member.member_id),
        status: member.row_type === 'human' ? 'review' : 'inactive',
        liveStatus: member.row_type === 'human' ? 'review' : 'ready',
        parentId: stageId,
        metrics: metricValue(member.cost_per_beat, member.tier),
        ...layout,
      })
    })
  })

  return nodes
}

function createEdges(nodes: FlowNodeDefinition[]) {
  const agents = nodes.filter((node) => node.kind === 'agent')
  const leftEndpoint = nodes.find((node) => node.kind === 'endpoint' && node.x < 200)
  const rightEndpoint = nodes.find((node) => node.kind === 'endpoint' && node.x > 1500)
  const ordered = [...agents].sort((a, b) => a.x - b.x || a.y - b.y)
  const edges: ScenarioRecord['edges'] = []

  if (leftEndpoint && ordered[0]) {
    edges.push({
      id: `edge-${leftEndpoint.id}-${ordered[0].id}`,
      source: leftEndpoint.id,
      target: ordered[0].id,
      live: true,
    })
  }

  for (let index = 0; index < ordered.length - 1; index += 1) {
    edges.push({
      id: `edge-${ordered[index].id}-${ordered[index + 1].id}`,
      source: ordered[index].id,
      target: ordered[index + 1].id,
      live: true,
    })
  }

  if (rightEndpoint && ordered[ordered.length - 1]) {
    edges.push({
      id: `edge-${ordered[ordered.length - 1].id}-${rightEndpoint.id}`,
      source: ordered[ordered.length - 1].id,
      target: rightEndpoint.id,
      live: true,
    })
  }

  return edges
}

function toPreviewServices(nodes: FlowNodeDefinition[]): PreviewService[] {
  return nodes
    .filter((node) => node.kind === 'agent')
    .slice(0, 6)
    .map((node) => ({
      id: `preview-${node.id}`,
      label: node.title,
      icon: node.icon,
      accent: node.accent,
    }))
}

function toActivity(scenarioKey: string, members: SupabaseScenarioMember[]): ActivityEntry[] {
  const voice = members.find((member) => member.row_type === 'voice')
  const review = members.find((member) => member.row_type === 'handler' || member.member_id.includes('human'))
  const vendor = members.find((member) => member.member_id.includes('vendor') || member.member_id.includes('repair'))

  return [
    {
      id: `${scenarioKey}-activity-sync`,
      label: 'Supabase registry loaded',
      detail: `${members.length} scenario members were mapped into the Railway-style workspace.`,
      time: 'Now',
    },
    {
      id: `${scenarioKey}-activity-review`,
      label: review ? `${review.name} ready` : 'Review stage ready',
      detail: review?.mission || 'Human review and approval are connected through the app-owned runtime.',
      time: 'Now',
    },
    {
      id: `${scenarioKey}-activity-voice`,
      label: voice ? `${voice.name} armed` : 'Intake armed',
      detail: vendor?.mission || 'Dispatch path is ready once orchestration starts.',
      time: 'Now',
    },
  ]
}

function mapScenarioRow(config: SupabaseScenarioConfigRow): ScenarioRecord {
  if (config.key === 'property') {
    return buildPropertyScenario(config)
  }

  if (config.key === 'fleet') {
    return buildFleetScenario(config)
  }

  const scenarioKey = config.key
  const members = config.members ?? []
  const nodes = toFlowNodes(scenarioKey, members)
  const stages = createStageDefinitions(scenarioKey, members)
  const title = config.label

  return {
    id: scenarioIdMap[scenarioKey] ?? scenarioKey,
    team: 'Teams',
    title,
    status: scenarioStatusMap[scenarioKey] ?? 'ready',
    environment: scenarioEnvironmentMap[scenarioKey] ?? 'production',
    description: config.description || `${title} loaded from Supabase scenario registry.`,
    updatedLabel: 'Synced from Supabase scenario registry',
    agents: members.filter((member) => member.row_type !== 'mcp' && member.row_type !== 'human').length,
    mcps: members.filter((member) => member.row_type === 'mcp').length,
    workflows: members.filter((member) => member.row_type === 'ai' || member.row_type === 'handler' || member.row_type === 'claw').length,
    servicesOnline: members.length,
    totalServices: members.length,
    previewServices: toPreviewServices(nodes),
    stages,
    nodes,
    edges: createEdges(nodes),
    activity: toActivity(scenarioKey, members),
    dockLabel: scenarioKey === 'fleet' ? 'LIVE FLEET CONTROL' : 'LIVE MCP CONTROL',
    detailSummary: `${title} is sourced from your Supabase scenario tables and rendered through the app-owned workspace contract.`,
  }
}

export class SupabaseScenarioRepository implements ScenarioRepository {
  async listScenarios(): Promise<ScenarioRecord[]> {
    const rows = await supabaseSelect<SupabaseScenarioRow[]>('cockpit_scenarios', {
      select: 'key,label,description,icon,url_path,active',
      active: 'eq.true',
      order: 'key.asc',
    })

    const configs = await Promise.all(
      rows.map(async (row) => {
        const results = await supabaseSelect<SupabaseScenarioConfigRow[]>('v_cockpit_scenario_config', {
          select: '*',
          key: `eq.${row.key}`,
        })

        if (!results.length) {
          return {
            ...row,
            members: [],
            layout_rows: null,
            layout_phases: null,
          }
        }

        return results[0]
      }),
    )

    return configs.map(mapScenarioRow)
  }

  async getScenarioById(scenarioId: string): Promise<ScenarioRecord | null> {
    const normalizedId =
      Object.entries(scenarioIdMap).find(([, publicId]) => publicId === scenarioId)?.[0] ?? scenarioId
    const rows = await supabaseSelect<SupabaseScenarioConfigRow[]>('v_cockpit_scenario_config', {
      select: '*',
      key: `eq.${normalizedId}`,
    })

    if (!rows.length) {
      return null
    }

    return mapScenarioRow(rows[0])
  }
}
