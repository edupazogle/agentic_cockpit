'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { FlowNodeDefinition, NodeStatus, StageDefinition } from '@/lib/domain/types'
import { IconGlyph } from '@/components/shared/icon-glyph'

type StageNodeData = StageDefinition

interface FlowCardData extends FlowNodeDefinition {
  resolvedStatus: NodeStatus
}

function InvisibleHandles() {
  return (
    <>
      <Handle className="rf-handle" position={Position.Left} type="target" />
      <Handle className="rf-handle" position={Position.Right} type="source" />
    </>
  )
}

export function StageGroupNode({ data }: NodeProps) {
  const stage = data as unknown as StageNodeData

  return (
    <div className="rf-stage">
      <div className="rf-stage-title">{stage.title}</div>
    </div>
  )
}

export function AgentNode({ data, selected }: NodeProps) {
  const card = data as unknown as FlowCardData
  const cardClassName = [
    'rf-card',
    `rf-card--${card.accent}`,
    `rf-card--${card.resolvedStatus}`,
    selected ? 'rf-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClassName}>
      <InvisibleHandles />
      <div className="rf-card-top">
        <div className={`rf-card-icon rf-card-icon--${card.accent}`}>
          <IconGlyph icon={card.icon} className="rf-card-icon-svg" />
        </div>
        <div className="rf-card-copy">
          <div className="rf-card-title">{card.title}</div>
          <div className="rf-card-subtitle">{card.subtitle}</div>
        </div>
      </div>
      <p className="rf-card-description">{card.description}</p>
      <div className="rf-card-footer">
        <div className="rf-card-status">
          <span className={`rf-status-dot rf-status-dot--${card.resolvedStatus}`} aria-hidden="true" />
          <span>{card.resolvedStatus}</span>
        </div>
        <div className="rf-card-metrics">
          {card.metrics?.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EndpointNode({ data, selected }: NodeProps) {
  const card = data as unknown as FlowCardData
  const cardClassName = [
    'rf-endpoint',
    `rf-endpoint--${card.accent}`,
    selected ? 'rf-endpoint--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClassName}>
      <InvisibleHandles />
      <div className="rf-endpoint-top">
        <div>
          <div className="rf-endpoint-title">{card.title}</div>
          <div className="rf-endpoint-subtitle">{card.subtitle}</div>
        </div>
      </div>
      <p className="rf-endpoint-description">{card.description}</p>
      <div className="rf-endpoint-footer">
        <span className="rf-card-status">
          <span className={`rf-status-dot rf-status-dot--${card.resolvedStatus}`} aria-hidden="true" />
          <span>{card.resolvedStatus}</span>
        </span>
      </div>
    </div>
  )
}
