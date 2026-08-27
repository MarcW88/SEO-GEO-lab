'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn, STATUS_CONFIG } from '@/lib/utils'
import type { Experiment, Capability, Tool, ExperimentStatus } from '@/lib/types'

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
  feeds:       '#22d3ee',
  enables:     '#10b981',
  validates:   '#34d399',
  extends:     '#06b6d4',
  related_to:  '#334155',
  replaced_by: '#ef4444',
  uses:        '#a78bfa',
}

function makeEdge(id: string, source: string, target: string, label: string): Edge {
  const color = EDGE_COLORS[label] ?? '#334155'
  return {
    id,
    source,
    target,
    label,
    animated: label === 'feeds',
    style: { stroke: color, strokeWidth: 1.5 },
    labelStyle: { fontSize: 9, fill: color, fontFamily: 'monospace' },
    labelBgStyle: { fill: 'rgba(5,5,8,0.9)', rx: 3, ry: 3 },
    labelBgPadding: [4, 3] as [number, number],
  }
}

// ─── Types ────────────────────────────────────────────────────

interface RawData {
  experiments: Experiment[]
  capabilities: Capability[]
  tools: Tool[]
}

interface CanvasProps {
  rawData: RawData | null
  showTools: boolean
  showExps: boolean
  showCaps: boolean
  statusFilter: string
  showLabels: boolean
}

// ─── Canvas (inside ReactFlowProvider) ────────────────────────

function MapCanvas({ rawData, showTools, showExps, showCaps, statusFilter, showLabels }: CanvasProps) {
  const { fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (!rawData) return
    const { experiments = [], capabilities = [], tools = [] } = rawData
    const toolIds = new Set(tools.map((t: Tool) => t.id))
    const expIds  = new Set(experiments.map((e: Experiment) => e.id))

    // ── Build ALL nodes ──────────────────────────────────────

    const allNodes: Node[] = []
    const allEdges: Edge[] = []

    capabilities.forEach((c: Capability, i: number) => {
      allNodes.push({
        id: c.id, type: 'capabilityNode',
        position: { x: 720, y: 80 + i * 200 },
        data: { label: c.name, color: c.color },
      })
    })

    experiments.forEach((exp: Experiment) => {
      const capIdx    = capabilities.findIndex((c: Capability) => c.id === exp.capability_id)
      const capExps   = experiments.filter((e: Experiment) => e.capability_id === exp.capability_id)
      const posInGrp  = capExps.indexOf(exp)
      const baseY     = capIdx >= 0 ? 80 + capIdx * 200 : 80
      const offset    = (posInGrp - (capExps.length - 1) / 2) * 150

      allNodes.push({
        id: exp.id, type: 'experimentNode',
        position: { x: 360, y: baseY + offset },
        data: { label: exp.name, status: exp.status, decision: exp.decision },
      })

      if (exp.capability_id && capabilities.some((c: Capability) => c.id === exp.capability_id))
        allEdges.push(makeEdge(`ec-${exp.id}`, exp.id, exp.capability_id, 'enables'))

      for (const tId of (exp.tool_ids ?? []))
        if (toolIds.has(tId))
          allEdges.push(makeEdge(`te-${tId}-${exp.id}`, tId, exp.id, 'uses'))

      for (const rId of (exp.related_ids ?? []))
        if (expIds.has(rId) && exp.id < rId)
          allEdges.push(makeEdge(`rel-${exp.id}-${rId}`, exp.id, rId, 'related_to'))
    })

    tools.forEach((t: Tool, i: number) => {
      allNodes.push({
        id: t.id, type: 'toolNode',
        position: { x: 60, y: 80 + i * 155 },
        data: { label: t.name },
      })
    })

    // ── Apply filters ────────────────────────────────────────

    const visibleIds = new Set<string>()
    const filteredNodes = allNodes.filter(n => {
      if (n.type === 'toolNode'       && !showTools) return false
      if (n.type === 'capabilityNode' && !showCaps)  return false
      if (n.type === 'experimentNode') {
        if (!showExps) return false
        if (statusFilter !== 'all' && (n.data?.status as string) !== statusFilter) return false
      }
      visibleIds.add(n.id)
      return true
    })

    const filteredEdges = allEdges
      .filter(e => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map(e => showLabels ? e : { ...e, label: undefined })

    setNodes(filteredNodes)
    setEdges(filteredEdges)
    requestAnimationFrame(() => fitView({ padding: 0.25, duration: 350 }))
  }, [rawData, showTools, showExps, showCaps, statusFilter, showLabels, setNodes, setEdges, fitView])

  return (
    <div className="w-full h-full" style={{ background: '#050508' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#050508' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(34,211,238,0.12)" />
        <Controls style={{ background: '#08080d', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }} />
        <MiniMap
          style={{ background: '#08080d', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }}
          maskColor="rgba(5,5,8,0.75)"
          nodeColor={(node) => {
            if (node.type === 'toolNode')       return '#92400e'
            if (node.type === 'capabilityNode') return '#5b21b6'
            const status = (node.data?.status as ExperimentStatus) ?? 'idea'
            const colors: Record<ExperimentStatus, string> = {
              idea: '#27272a', testing: '#164e63', validated: '#14532d',
              production: '#3b0764', failed: '#450a0a', paused: '#451a03', archived: '#18181b',
            }
            return colors[status] ?? '#27272a'
          }}
        />
      </ReactFlow>
    </div>
  )
}

// ─── Status filter config ─────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',        label: 'All' },
  { value: 'testing',    label: 'Running' },
  { value: 'production', label: 'Deployed' },
  { value: 'validated',  label: 'Validated' },
  { value: 'failed',     label: 'Derezzed' },
]

// ─── Outer wrapper — holds filter state + filter bar ──────────

export default function MapView() {
  const [rawData,      setRawData]      = useState<RawData | null>(null)
  const [showTools,    setShowTools]    = useState(true)
  const [showExps,     setShowExps]     = useState(true)
  const [showCaps,     setShowCaps]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showLabels,   setShowLabels]   = useState(true)

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setRawData).catch(() => {})
  }, [])

  const counts = useMemo(() => ({
    tools: rawData?.tools?.length ?? 0,
    exps:  rawData?.experiments?.length ?? 0,
    caps:  rawData?.capabilities?.length ?? 0,
  }), [rawData])

  return (
    <div className="flex flex-col h-full">

      {/* ── Filter bar ── */}
      <div
        className="px-4 py-2 border-b border-cyan-900/20 flex items-center gap-3 shrink-0 flex-wrap"
        style={{ background: 'rgba(5,5,8,0.95)' }}
      >
        {/* Type toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTools(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all',
              showTools
                ? 'bg-amber-950/40 border-amber-900/50 text-amber-400'
                : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
            )}
          >
            <span>⬡</span> Programs
            {counts.tools > 0 && (
              <span className={cn('text-[10px]', showTools ? 'text-amber-600' : 'text-zinc-700')}>
                {counts.tools}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowExps(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all',
              showExps
                ? 'bg-cyan-950/30 border-cyan-900/40 text-cyan-400'
                : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
            )}
          >
            <span>◉</span> Simulations
            {counts.exps > 0 && (
              <span className={cn('text-[10px]', showExps ? 'text-cyan-700' : 'text-zinc-700')}>
                {counts.exps}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowCaps(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all',
              showCaps
                ? 'bg-violet-950/30 border-violet-900/40 text-violet-400'
                : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
            )}
          >
            <span>◈</span> Functions
            {counts.caps > 0 && (
              <span className={cn('text-[10px]', showCaps ? 'text-violet-700' : 'text-zinc-700')}>
                {counts.caps}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-cyan-900/30" />

        {/* Status filter (only relevant when Simulations visible) */}
        <div className={cn('flex items-center gap-1 transition-opacity', !showExps && 'opacity-30 pointer-events-none')}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-mono border transition-all',
                statusFilter === f.value
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                  : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-cyan-900/30" />

        {/* Labels toggle */}
        <button
          onClick={() => setShowLabels(v => !v)}
          className={cn(
            'px-2 py-1 rounded-md text-[11px] font-mono border transition-all',
            showLabels
              ? 'border-zinc-700 text-zinc-400 bg-zinc-800/40'
              : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
          )}
        >
          Labels
        </button>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1">
        <ReactFlowProvider>
          <MapCanvas
            rawData={rawData}
            showTools={showTools}
            showExps={showExps}
            showCaps={showCaps}
            statusFilter={statusFilter}
            showLabels={showLabels}
          />
        </ReactFlowProvider>
      </div>

    </div>
  )
}
