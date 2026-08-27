'use client'

import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { STATUS_CONFIG } from '@/lib/utils'
import type { ExperimentStatus } from '@/lib/types'

function ExperimentNode({ data }: NodeProps) {
  const { label, status, decision } = data as { label: string; status: ExperimentStatus; decision: string | null }
  const cfg = STATUS_CONFIG[status]
  return (
    <div
      className={`px-3 py-2 rounded-xl border min-w-[160px] max-w-[200px] shadow-lg ${cfg.bg} ${cfg.border}`}
      style={{ borderWidth: 1 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#52525b', border: 'none', width: 8, height: 8 }} />
      <div className={`text-[10px] font-medium mb-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </div>
      <div className="text-[12px] font-semibold text-zinc-100 leading-snug">
        {label}
      </div>
      {decision && (
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          → {decision}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#52525b', border: 'none', width: 8, height: 8 }} />
    </div>
  )
}

function ToolNode({ data }: NodeProps) {
  const { label } = data as { label: string }
  return (
    <div className="px-3 py-2 rounded-xl border border-amber-900/60 bg-amber-950/30 min-w-[120px] shadow-lg">
      <Handle type="target" position={Position.Left} style={{ background: '#78716c', border: 'none', width: 8, height: 8 }} />
      <div className="text-[10px] font-medium text-amber-500 mb-1">🔧 Tool</div>
      <div className="text-[12px] font-semibold text-zinc-200">{label}</div>
      <Handle type="source" position={Position.Right} style={{ background: '#78716c', border: 'none', width: 8, height: 8 }} />
    </div>
  )
}

function CapabilityNode({ data }: NodeProps) {
  const { label, color } = data as { label: string; color: string }
  return (
    <div
      className="px-3 py-2 rounded-xl border min-w-[130px] shadow-lg"
      style={{
        borderColor: `${color}40`,
        backgroundColor: `${color}12`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#52525b', border: 'none', width: 8, height: 8 }} />
      <div className="text-[10px] font-medium mb-1" style={{ color }}>
        ◈ Capability
      </div>
      <div className="text-[12px] font-semibold text-zinc-200">{label}</div>
      <Handle type="source" position={Position.Right} style={{ background: '#52525b', border: 'none', width: 8, height: 8 }} />
    </div>
  )
}

const nodeTypes = {
  experimentNode: ExperimentNode,
  toolNode: ToolNode,
  capabilityNode: CapabilityNode,
}

export const EDGE_COLORS: Record<string, string> = {
  feeds: '#6366f1',
  enables: '#10b981',
  validates: '#22c55e',
  extends: '#06b6d4',
  related_to: '#a1a1aa',
  replaced_by: '#ef4444',
  uses: '#8b5cf6',
}

const initialNodes: never[] = []
const initialEdges: never[] = []

export default function MapView() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full h-full" style={{ background: '#09090b' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#09090b' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <Controls
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 8,
          }}
          maskColor="#09090b88"
          nodeColor={(node) => {
            if (node.type === 'toolNode') return '#78350f'
            if (node.type === 'capabilityNode') return '#1d4ed8'
            const status = (node.data?.status as ExperimentStatus) ?? 'idea'
            const colors: Record<ExperimentStatus, string> = {
              idea: '#3f3f46',
              testing: '#1e3a5f',
              validated: '#14532d',
              production: '#2e1065',
              failed: '#450a0a',
              paused: '#451a03',
              archived: '#1c1c1c',
            }
            return colors[status] ?? '#3f3f46'
          }}
        />
      </ReactFlow>
    </div>
  )
}
