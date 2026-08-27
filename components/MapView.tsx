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
  MarkerType,
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

const EDGE_COLORS: Record<string, string> = {
  feeds: '#6366f1',
  enables: '#10b981',
  validates: '#22c55e',
  extends: '#06b6d4',
  related_to: '#a1a1aa',
  replaced_by: '#ef4444',
  uses: '#8b5cf6',
}

const initialNodes = [
  { id: 'dataforseo', type: 'toolNode', position: { x: 0, y: 60 }, data: { label: 'DataForSEO' } },
  { id: 'semactic', type: 'toolNode', position: { x: 0, y: 280 }, data: { label: 'Semactic' } },
  { id: 'reddit-api', type: 'toolNode', position: { x: 0, y: 420 }, data: { label: 'Reddit API' } },
  { id: 'openai', type: 'toolNode', position: { x: 0, y: 560 }, data: { label: 'OpenAI / Anthropic' } },

  {
    id: 'dataforseo-historical',
    type: 'experimentNode',
    position: { x: 260, y: 0 },
    data: { label: 'DataForSEO Historical', status: 'validated', decision: 'industrialize' },
  },
  {
    id: 'semantic-clustering',
    type: 'experimentNode',
    position: { x: 260, y: 110 },
    data: { label: 'Semantic Clustering v2', status: 'validated', decision: 'industrialize' },
  },
  {
    id: 'competitor-gap',
    type: 'experimentNode',
    position: { x: 260, y: 220 },
    data: { label: 'Competitor Gap', status: 'production', decision: 'keep' },
  },
  {
    id: 'geo-source-analysis',
    type: 'experimentNode',
    position: { x: 260, y: 330 },
    data: { label: 'GEO Source Analysis', status: 'validated', decision: 'deepen' },
  },
  {
    id: 'reddit-source-impact',
    type: 'experimentNode',
    position: { x: 260, y: 440 },
    data: { label: 'Reddit Source Impact', status: 'validated', decision: 'deepen' },
  },
  {
    id: 'llm-citation-freq',
    type: 'experimentNode',
    position: { x: 260, y: 550 },
    data: { label: 'LLM Citation Frequency', status: 'testing', decision: 'deepen' },
  },
  {
    id: 'ard-discovery',
    type: 'experimentNode',
    position: { x: 260, y: 660 },
    data: { label: 'ARD / KG Discovery', status: 'testing', decision: 'deepen' },
  },
  {
    id: 'mcp-agentic',
    type: 'experimentNode',
    position: { x: 260, y: 770 },
    data: { label: 'MCP Agentic Discovery', status: 'testing', decision: 'deepen' },
  },
  {
    id: 'youtube-source',
    type: 'experimentNode',
    position: { x: 260, y: 880 },
    data: { label: 'YouTube Source Impact', status: 'idea', decision: null },
  },

  {
    id: 'content-gap-scoring',
    type: 'experimentNode',
    position: { x: 580, y: 160 },
    data: { label: 'Content Gap Scoring', status: 'validated', decision: 'deepen' },
  },

  {
    id: 'cap-keyword-intel',
    type: 'capabilityNode',
    position: { x: 880, y: 60 },
    data: { label: 'Keyword Intelligence', color: '#8b5cf6' },
  },
  {
    id: 'cap-seo-benchmark',
    type: 'capabilityNode',
    position: { x: 880, y: 180 },
    data: { label: 'SEO Benchmark', color: '#06b6d4' },
  },
  {
    id: 'cap-content',
    type: 'capabilityNode',
    position: { x: 880, y: 300 },
    data: { label: 'Content Intelligence', color: '#10b981' },
  },
  {
    id: 'cap-geo-sources',
    type: 'capabilityNode',
    position: { x: 880, y: 420 },
    data: { label: 'GEO Sources', color: '#f59e0b' },
  },
  {
    id: 'cap-offsite-geo',
    type: 'capabilityNode',
    position: { x: 880, y: 540 },
    data: { label: 'Offsite GEO', color: '#f97316' },
  },
  {
    id: 'cap-agentic',
    type: 'capabilityNode',
    position: { x: 880, y: 660 },
    data: { label: 'Agentic Visibility', color: '#ef4444' },
  },
]

const initialEdges = [
  { id: 'e-df-hist', source: 'dataforseo', target: 'dataforseo-historical', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-df-gap', source: 'dataforseo', target: 'competitor-gap', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-df-sc', source: 'dataforseo', target: 'semantic-clustering', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-sem-geo', source: 'semactic', target: 'geo-source-analysis', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-sem-reddit', source: 'semactic', target: 'reddit-source-impact', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-reddit-ri', source: 'reddit-api', target: 'reddit-source-impact', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-openai-llm', source: 'openai', target: 'llm-citation-freq', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-openai-ard', source: 'openai', target: 'ard-discovery', label: 'feeds', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.feeds, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-hist-gap', source: 'dataforseo-historical', target: 'competitor-gap', label: 'enables', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.enables, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-gap-content', source: 'competitor-gap', target: 'content-gap-scoring', label: 'enables', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.enables, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-sc-content', source: 'semantic-clustering', target: 'content-gap-scoring', label: 'enables', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.enables, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-reddit-geo', source: 'reddit-source-impact', target: 'geo-source-analysis', label: 'validates', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.validates, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-reddit-yt', source: 'reddit-source-impact', target: 'youtube-source', label: 'extends', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.extends, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-ard-mcp', source: 'ard-discovery', target: 'mcp-agentic', label: 'related', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: EDGE_COLORS.related_to, strokeWidth: 1.5 }, labelStyle: { fill: '#71717a', fontSize: 10 } },
  { id: 'e-gap-cap-kw', source: 'competitor-gap', target: 'cap-keyword-intel', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-sc-cap-kw', source: 'semantic-clustering', target: 'cap-keyword-intel', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-hist-cap-bench', source: 'dataforseo-historical', target: 'cap-seo-benchmark', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-content-cap', source: 'content-gap-scoring', target: 'cap-content', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-geo-cap', source: 'geo-source-analysis', target: 'cap-geo-sources', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-reddit-cap', source: 'reddit-source-impact', target: 'cap-offsite-geo', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-ard-cap', source: 'ard-discovery', target: 'cap-agentic', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e-mcp-cap', source: 'mcp-agentic', target: 'cap-agentic', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' } },
]

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
