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
  const handleStyle = { background: '#22d3ee', border: 'none', width: 7, height: 7, boxShadow: '0 0 6px #22d3ee80' }
  return (
    <div
      className={`px-3 py-2 rounded-lg border min-w-[160px] max-w-[200px] ${cfg.bg} ${cfg.border}`}
      style={{ borderWidth: 1, boxShadow: `0 0 12px ${cfg.color.includes('cyan') ? 'rgba(34,211,238,0.15)' : cfg.color.includes('emerald') ? 'rgba(16,185,129,0.12)' : cfg.color.includes('violet') ? 'rgba(139,92,246,0.12)' : 'rgba(0,0,0,0.3)'}` }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className={`text-[10px] font-mono font-medium mb-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label.toUpperCase()}
      </div>
      <div className="text-[12px] font-semibold text-[#cff5ff] leading-snug">
        {label}
      </div>
      {decision && (
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-cyan-800 font-mono">
          → {decision}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

function ToolNode({ data }: NodeProps) {
  const { label } = data as { label: string }
  const handleStyle = { background: '#f59e0b', border: 'none', width: 7, height: 7, boxShadow: '0 0 6px rgba(245,158,11,0.5)' }
  return (
    <div className="px-3 py-2 rounded-lg border border-amber-900/50 bg-amber-950/20 min-w-[120px]" style={{ boxShadow: '0 0 10px rgba(217,119,6,0.1)' }}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="text-[10px] font-mono font-medium text-amber-500/80 mb-1 uppercase tracking-wider">⬡ Program</div>
      <div className="text-[12px] font-semibold text-[#cff5ff]">{label}</div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

function CapabilityNode({ data }: NodeProps) {
  const { label, color } = data as { label: string; color: string }
  const handleStyle = { background: color, border: 'none', width: 7, height: 7, boxShadow: `0 0 6px ${color}80` }
  return (
    <div
      className="px-3 py-2 rounded-lg border min-w-[130px]"
      style={{
        borderColor: `${color}35`,
        backgroundColor: `${color}0d`,
        boxShadow: `0 0 12px ${color}18`,
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="text-[10px] font-mono font-medium mb-1 uppercase tracking-wider" style={{ color }}>
        ◈ Function
      </div>
      <div className="text-[12px] font-semibold text-[#cff5ff]">{label}</div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

const nodeTypes = {
  experimentNode: ExperimentNode,
  toolNode: ToolNode,
  capabilityNode: CapabilityNode,
}

export const EDGE_COLORS: Record<string, string> = {
  feeds: '#22d3ee',
  enables: '#10b981',
  validates: '#34d399',
  extends: '#06b6d4',
  related_to: '#334155',
  replaced_by: '#ef4444',
  uses: '#a78bfa',
}

const initialNodes: never[] = []
const initialEdges: never[] = []

export default function MapView() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full h-full" style={{ background: '#050508' }}>
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
        style={{ background: '#050508' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(34,211,238,0.12)"
        />
        <Controls
          style={{
            background: '#08080d',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: '#08080d',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 8,
          }}
          maskColor="rgba(5,5,8,0.75)"
          nodeColor={(node) => {
            if (node.type === 'toolNode') return '#92400e'
            if (node.type === 'capabilityNode') return '#5b21b6'
            const status = (node.data?.status as ExperimentStatus) ?? 'idea'
            const colors: Record<ExperimentStatus, string> = {
              idea: '#27272a',
              testing: '#164e63',
              validated: '#14532d',
              production: '#3b0764',
              failed: '#450a0a',
              paused: '#451a03',
              archived: '#18181b',
            }
            return colors[status] ?? '#27272a'
          }}
        />
      </ReactFlow>
    </div>
  )
}
