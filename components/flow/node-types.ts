import type { NodeTypes } from '@xyflow/react'

import { AgentNode, EndpointNode, StageGroupNode } from '@/components/flow/flow-nodes'

export const nodeTypes: NodeTypes = {
  agentCard: AgentNode,
  endpointCard: EndpointNode,
  stageGroup: StageGroupNode,
}
