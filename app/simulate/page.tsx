'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  type Connection,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Search, Save, Trash2, Zap, Plus, X, FlaskConical } from 'lucide-react'
import { cn, STATUS_CONFIG } from '@/lib/utils'
import type { Experiment, Capability, Tool, ExperimentStatus } from '@/lib/types'

// ─── TRON edge colours ────────────────────────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
  feeds: '#22d3ee',
  enables: '#10b981',
  validates: '#34d399',
  extends: '#06b6d4',
  related_to: '#334155',
  replaced_by: '#ef4444',
  uses: '#a78bfa',
}

const RELATION_TYPES = [
  { value: 'feeds',      label: 'Feeds' },
  { value: 'enables',    label: 'Enables' },
  { value: 'validates',  label: 'Validates' },
  { value: 'extends',    label: 'Extends' },
  { value: 'uses',       label: 'Uses' },
  { value: 'related_to', label: 'Related to' },
  { value: 'replaced_by',label: 'Replaces' },
]

// ─── Node components ──────────────────────────────────────────────────────────

function SimExpNode({ data }: NodeProps) {
  const { label, status, decision } = data as {
    label: string; status: ExperimentStatus; decision?: string
  }
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idea
  const hs = { background: '#22d3ee', border: 'none', width: 7, height: 7, boxShadow: '0 0 6px #22d3ee80' }
  return (
    <div
      className={`px-3 py-2 rounded-lg border min-w-[150px] max-w-[200px] ${cfg.bg} ${cfg.border}`}
      style={{ borderWidth: 1 }}
    >
      <Handle type="target" position={Position.Left} style={hs} />
      <div className={`text-[10px] font-mono font-medium mb-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label.toUpperCase()}
      </div>
      <div className="text-[12px] font-semibold text-[#cff5ff] leading-snug">{label}</div>
      {decision && (
        <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-cyan-800 font-mono">
          → {decision}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={hs} />
    </div>
  )
}

function SimToolNode({ data }: NodeProps) {
  const { label } = data as { label: string }
  const hs = { background: '#f59e0b', border: 'none', width: 7, height: 7, boxShadow: '0 0 6px rgba(245,158,11,0.5)' }
  return (
    <div
      className="px-3 py-2 rounded-lg border border-amber-900/50 bg-amber-950/20 min-w-[110px]"
      style={{ boxShadow: '0 0 10px rgba(217,119,6,0.08)' }}
    >
      <Handle type="target" position={Position.Left} style={hs} />
      <div className="text-[10px] font-mono font-medium text-amber-500/80 mb-1 uppercase tracking-wider">⬡ Program</div>
      <div className="text-[12px] font-semibold text-[#cff5ff]">{label}</div>
      <Handle type="source" position={Position.Right} style={hs} />
    </div>
  )
}

function SimCapNode({ data }: NodeProps) {
  const { label, color } = data as { label: string; color: string }
  const c = color ?? '#6366f1'
  const hs = { background: c, border: 'none', width: 7, height: 7, boxShadow: `0 0 6px ${c}80` }
  return (
    <div
      className="px-3 py-2 rounded-lg border min-w-[130px]"
      style={{ borderColor: `${c}35`, backgroundColor: `${c}0d`, boxShadow: `0 0 12px ${c}18` }}
    >
      <Handle type="target" position={Position.Left} style={hs} />
      <div className="text-[10px] font-mono font-medium mb-1 uppercase tracking-wider" style={{ color: c }}>
        ◈ Function
      </div>
      <div className="text-[12px] font-semibold text-[#cff5ff]">{label}</div>
      <Handle type="source" position={Position.Right} style={hs} />
    </div>
  )
}

const NODE_TYPES = {
  experimentNode: SimExpNode,
  toolNode:       SimToolNode,
  capabilityNode: SimCapNode,
}

// ─── Lab item type ────────────────────────────────────────────────────────────

interface LabItem {
  id: string
  label: string
  type: 'experiment' | 'capability' | 'tool'
  sub?: string
  data: Record<string, unknown>
}

const TYPE_LABELS:  Record<string, string> = { experiment: 'Simulation', capability: 'Function', tool: 'Program' }
const TYPE_COLORS:  Record<string, string> = { experiment: 'text-cyan-500', capability: 'text-violet-400', tool: 'text-amber-500' }
const STATUS_MAP:   Record<string, string> = {
  idea: 'Initialized', testing: 'Running', validated: 'Validated',
  production: 'Deployed', failed: 'Derezzed', paused: 'Suspended', archived: 'Archived',
}

// ─── Main canvas (needs ReactFlowProvider parent) ─────────────────────────────

function SimulateCanvas() {
  const [experiments,   setExperiments]   = useState<Experiment[]>([])
  const [capabilities,  setCapabilities]  = useState<Capability[]>([])
  const [tools,         setTools]         = useState<Tool[]>([])
  const [search,        setSearch]        = useState('')
  const [nodes, setNodes, onNodesChange]  = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange]  = useEdgesState<Edge>([])
  const [pendingEdge,   setPendingEdge]   = useState<Connection | null>(null)
  const [simName,       setSimName]       = useState('')
  const [hypothesis,    setHypothesis]    = useState('')
  const [expectedValue, setExpectedValue] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)

  // ── Convert state ────────────────────────────────────────────
  const router = useRouter()
  const [showConvert,  setShowConvert]  = useState(false)
  const [convName,     setConvName]     = useState('')
  const [convCapId,    setConvCapId]    = useState('')
  const [convToolIds,  setConvToolIds]  = useState<string[]>([])
  const [convStatus,   setConvStatus]   = useState<ExperimentStatus>('idea')
  const [convQuestion, setConvQuestion] = useState('')
  const [convTags,     setConvTags]     = useState('')
  const [converting,   setConverting]   = useState(false)

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(({ experiments = [], capabilities = [], tools = [] }) => {
        setExperiments(experiments)
        setCapabilities(capabilities)
        setTools(tools)
      })
      .catch(() => {})
  }, [])

  // ── Search ──────────────────────────────────────────────────

  const searchResults = useMemo<LabItem[]>(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const items: LabItem[] = []
    for (const e of experiments) {
      if (e.name.toLowerCase().includes(q) || (e.question ?? '').toLowerCase().includes(q))
        items.push({ id: e.id, label: e.name, type: 'experiment', sub: e.status,
          data: e as unknown as Record<string, unknown> })
    }
    for (const c of capabilities) {
      if (c.name.toLowerCase().includes(q))
        items.push({ id: c.id, label: c.name, type: 'capability',
          data: c as unknown as Record<string, unknown> })
    }
    for (const t of tools) {
      if (t.name.toLowerCase().includes(q))
        items.push({ id: t.id, label: t.name, type: 'tool',
          data: t as unknown as Record<string, unknown> })
    }
    return items.slice(0, 10)
  }, [search, experiments, capabilities, tools])

  const isOnCanvas = (id: string) => nodes.some(n => n.id === id)

  // ── Add node to canvas ───────────────────────────────────────

  const addToCanvas = (item: LabItem) => {
    if (isOnCanvas(item.id)) return
    const count = nodes.length
    setNodes(prev => [
      ...prev,
      {
        id:       item.id,
        type:     item.type === 'capability' ? 'capabilityNode'
                : item.type === 'tool'       ? 'toolNode'
                :                             'experimentNode',
        position: {
          x: 160 + (count % 3) * 240,
          y: 100 + Math.floor(count / 3) * 175,
        },
        data: { label: item.label, ...item.data },
      },
    ])
  }

  // ── Connect nodes ────────────────────────────────────────────

  const onConnect = useCallback((connection: Connection) => {
    setPendingEdge(connection)
  }, [])

  const confirmEdge = (relationType: string) => {
    if (!pendingEdge) return
    const color = EDGE_COLORS[relationType] ?? '#22d3ee'
    setEdges(prev => addEdge({
      ...pendingEdge,
      id: `e-${pendingEdge.source}-${pendingEdge.target}-${Date.now()}`,
      label: relationType,
      animated: relationType === 'feeds',
      style: { stroke: color, strokeWidth: 1.5 },
      labelStyle: { fontSize: 9, fill: color, fontFamily: 'monospace' },
      labelBgStyle: { fill: 'rgba(5,5,8,0.9)', rx: 3, ry: 3 },
      labelBgPadding: [4, 3] as [number, number],
    }, prev))
    setPendingEdge(null)
  }

  // ── Save simulation ──────────────────────────────────────────

  const handleSave = async () => {
    if (nodes.length === 0) return
    setSaving(true)
    try {
      await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           simName || 'Untitled Simulation',
          hypothesis,
          expected_value: expectedValue,
          notes,
          nodes: nodes.map(n => ({
            entity_id:   n.id,
            entity_type: n.type,
            position_x:  n.position.x,
            position_y:  n.position.y,
          })),
          edges: edges.map(e => ({
            source_id:     e.source,
            target_id:     e.target,
            relation_type: (e.label as string) ?? 'related_to',
          })),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const openConvert = () => {
    const capNode  = nodes.find(n => n.type === 'capabilityNode')
    const toolNodes = nodes.filter(n => n.type === 'toolNode')
    setConvName(simName || '')
    setConvCapId((capNode?.id as string) ?? '')
    setConvToolIds(toolNodes.map(n => n.id as string))
    setConvQuestion(hypothesis || '')
    setConvTags('')
    setConvStatus('idea')
    setShowConvert(true)
  }

  const handleConvert = async () => {
    if (!convName.trim()) return
    setConverting(true)
    try {
      const expNodes = nodes.filter(n => n.type === 'experimentNode')
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          convName.trim(),
          capability_id: convCapId,
          tool_ids:      convToolIds,
          related_ids:   expNodes.map(n => n.id as string),
          status:        convStatus,
          question:      convQuestion,
          tags:          convTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      const { id, error } = await res.json()
      if (error) throw new Error(error)
      router.push(`/experiments/${id}`)
    } catch {
      setConverting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Header ── */}
      <div
        className="px-5 py-3 border-b border-cyan-900/25 flex items-center justify-between shrink-0"
        style={{ boxShadow: '0 1px 0 rgba(34,211,238,0.04)' }}
      >
        <div>
          <h1 className="text-base font-bold text-cyan-300 tracking-widest font-mono">SIMULATE</h1>
          <p className="text-[11px] text-cyan-800 mt-0.5 font-mono">
            Hypothetical workspace — nothing here affects your Lab
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setNodes([]); setEdges([]) }}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-600 hover:text-red-400 border border-zinc-800/60 hover:border-red-900/40 rounded-lg transition-all disabled:opacity-30"
          >
            <Trash2 className="w-3 h-3" />
            CLEAR
          </button>
          <button
            onClick={openConvert}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-violet-900/40 hover:bg-violet-800/40 border border-violet-800/40 text-violet-300 rounded-lg transition-all disabled:opacity-30"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            CONVERT
          </button>
          <button
            onClick={handleSave}
            disabled={saving || nodes.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all',
              saved
                ? 'bg-emerald-900/40 border border-emerald-800/40 text-emerald-400'
                : 'bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-800/40 text-cyan-300 disabled:opacity-30',
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'SAVED ✓' : saving ? 'SAVING…' : 'SAVE SIM'}
          </button>
        </div>
      </div>

      {/* ── 3-col body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left: Search Lab ── */}
        <div className="w-56 shrink-0 border-r border-cyan-900/20 flex flex-col">
          <div className="p-3 border-b border-cyan-900/15">
            <div className="text-[10px] font-mono text-cyan-700 uppercase tracking-wider mb-2">
              Search Lab
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="programs, functions…"
                className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-900/50 font-mono transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {search.trim() === '' ? (
              <p className="text-[11px] text-zinc-700 font-mono text-center p-4 leading-relaxed">
                Search programs,<br />functions or simulations<br />to add to the canvas
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-zinc-700 font-mono text-center py-6">No results</p>
            ) : (
              searchResults.map(item => {
                const onCanvas = isOnCanvas(item.id)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start justify-between gap-2 p-2 rounded-lg border transition-all',
                      onCanvas
                        ? 'border-cyan-900/30 bg-cyan-950/20 opacity-40'
                        : 'border-zinc-800/40 hover:border-zinc-700/50 hover:bg-zinc-900/30',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-[10px] font-mono font-semibold uppercase tracking-wider', TYPE_COLORS[item.type])}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <div className="text-xs text-zinc-300 leading-snug line-clamp-2 mt-0.5">
                        {item.label}
                      </div>
                      {item.sub && (
                        <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                          {STATUS_MAP[item.sub] ?? item.sub}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addToCanvas(item)}
                      disabled={onCanvas}
                      title={onCanvas ? 'Already on canvas' : 'Add to canvas'}
                      className={cn(
                        'shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all',
                        onCanvas
                          ? 'bg-zinc-800 text-zinc-600 cursor-default'
                          : 'bg-cyan-900/40 hover:bg-cyan-700/50 border border-cyan-800/40 text-cyan-400',
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {nodes.length > 0 && (
            <div className="px-3 py-2 border-t border-cyan-900/15 flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-800">
                {nodes.length} node{nodes.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] font-mono text-cyan-900">
                {edges.length} link{edges.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 min-w-0 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#050508' }}
            deleteKeyCode="Delete"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="rgba(34,211,238,0.1)"
            />
            <Controls
              style={{
                background: '#08080d',
                border: '1px solid rgba(34,211,238,0.15)',
                borderRadius: 8,
              }}
            />
          </ReactFlow>

          {/* Empty state overlay */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <Zap className="w-8 h-8 text-cyan-900 mb-3" />
              <p className="text-sm font-mono text-cyan-900 tracking-widest">CANVAS EMPTY</p>
              <p className="text-[11px] text-zinc-800 font-mono mt-2">
                Search elements on the left and add them here
              </p>
              <p className="text-[10px] text-zinc-900 font-mono mt-1">
                Drag handles to connect · Del to remove
              </p>
            </div>
          )}

          {/* Relation picker modal */}
          {pendingEdge && (
            <div
              className="absolute inset-0 flex items-center justify-center z-50"
              style={{ background: 'rgba(5,5,8,0.55)' }}
              onClick={() => setPendingEdge(null)}
            >
              <div
                className="bg-[#08080d] border border-cyan-900/40 rounded-xl p-4 shadow-2xl w-44"
                style={{ boxShadow: '0 0 40px rgba(34,211,238,0.08)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-cyan-700 uppercase tracking-wider">
                    Link type
                  </span>
                  <button
                    onClick={() => setPendingEdge(null)}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {RELATION_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => confirmEdge(rt.value)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/30 text-xs text-zinc-400 hover:text-cyan-300 transition-colors font-mono"
                  >
                    <span style={{ color: EDGE_COLORS[rt.value] }}>●</span>
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Simulation Config ── */}
        <div className="w-56 shrink-0 border-l border-cyan-900/20 flex flex-col">
          <div className="p-3 border-b border-cyan-900/15">
            <div className="text-[10px] font-mono text-cyan-700 uppercase tracking-wider">
              Simulation Config
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            <div>
              <label className="text-[10px] font-mono text-cyan-800 uppercase tracking-wider block mb-1.5">
                Name
              </label>
              <input
                value={simName}
                onChange={e => setSimName(e.target.value)}
                placeholder="Simulation name…"
                className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-900/50 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-800 uppercase tracking-wider block mb-1.5">
                Hypothesis
              </label>
              <textarea
                value={hypothesis}
                onChange={e => setHypothesis(e.target.value)}
                placeholder="What are you testing? What happens if…?"
                rows={5}
                className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-900/50 resize-none transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-800 uppercase tracking-wider block mb-2">
                Expected value
              </label>
              <div className="flex flex-col gap-1">
                {(['low', 'medium', 'high'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setExpectedValue(v)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all',
                      expectedValue === v
                        ? v === 'high'
                          ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
                          : v === 'medium'
                          ? 'bg-amber-950/30 border-amber-900/40 text-amber-400'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                        : 'border-zinc-800/40 text-zinc-600 hover:text-zinc-400',
                    )}
                  >
                    <span>{expectedValue === v ? '◆' : '○'}</span>
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-cyan-800 uppercase tracking-wider block mb-1.5">
                Missing pieces
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Blockers, questions, dependencies…"
                rows={4}
                className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-900/50 resize-none transition-all leading-relaxed"
              />
            </div>

          </div>
        </div>

      </div>

      {/* ── Convert to Experiment modal ── */}
      {showConvert && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(5,5,8,0.75)' }}
          onClick={() => setShowConvert(false)}
        >
          <div
            className="bg-[#08080d] border border-violet-900/40 rounded-xl p-5 w-[480px] max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 0 50px rgba(139,92,246,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-violet-300 tracking-widest font-mono">CONVERT TO EXPERIMENT</div>
                <div className="text-[11px] text-violet-800 font-mono mt-0.5">Creates a real entry in your Lab</div>
              </div>
              <button onClick={() => setShowConvert(false)} className="text-zinc-600 hover:text-zinc-400 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas summary */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-lg">
              {nodes.filter(n => n.type === 'toolNode').length > 0 && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/30 border border-amber-900/30 px-2 py-1 rounded">
                  ⬡ {nodes.filter(n => n.type === 'toolNode').length} Program{nodes.filter(n => n.type === 'toolNode').length > 1 ? 's' : ''}
                </span>
              )}
              {nodes.filter(n => n.type === 'capabilityNode').length > 0 && (
                <span className="text-[10px] font-mono text-violet-400 bg-violet-950/30 border border-violet-900/30 px-2 py-1 rounded">
                  ◈ {nodes.filter(n => n.type === 'capabilityNode').length} Function
                </span>
              )}
              {nodes.filter(n => n.type === 'experimentNode').length > 0 && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-900/30 px-2 py-1 rounded">
                  ◉ {nodes.filter(n => n.type === 'experimentNode').length} Related
                </span>
              )}
              {nodes.length === 0 && (
                <span className="text-[11px] font-mono text-zinc-600">No nodes on canvas</span>
              )}
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={convName}
                  onChange={e => setConvName(e.target.value)}
                  placeholder="Experiment name…"
                  className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-violet-900/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={convStatus}
                    onChange={e => setConvStatus(e.target.value as ExperimentStatus)}
                    className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-900/50 transition-all"
                  >
                    <option value="idea">Initialized</option>
                    <option value="testing">Running</option>
                    <option value="validated">Validated</option>
                    <option value="production">Deployed</option>
                  </select>
                </div>
                {/* Capability */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Function</label>
                  <select
                    value={convCapId}
                    onChange={e => setConvCapId(e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-900/50 transition-all"
                  >
                    <option value="">— none —</option>
                    {capabilities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Question</label>
                <textarea
                  value={convQuestion}
                  onChange={e => setConvQuestion(e.target.value)}
                  placeholder="What specific question does this experiment answer?"
                  rows={3}
                  className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-violet-900/50 resize-none transition-all"
                />
              </div>

              {/* Tools */}
              {nodes.filter(n => n.type === 'toolNode').length > 0 && (
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">Programs used</label>
                  <div className="flex flex-wrap gap-3">
                    {nodes.filter(n => n.type === 'toolNode').map(n => (
                      <label key={n.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={convToolIds.includes(n.id as string)}
                          onChange={e => {
                            const id = n.id as string
                            if (e.target.checked) setConvToolIds(prev => [...prev, id])
                            else setConvToolIds(prev => prev.filter(x => x !== id))
                          }}
                          className="accent-amber-500"
                        />
                        <span className="text-xs font-mono text-amber-400">{n.data.label as string}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Tags</label>
                <input
                  value={convTags}
                  onChange={e => setConvTags(e.target.value)}
                  placeholder="seo, data, competitive… (comma separated)"
                  className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-violet-900/50 transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-zinc-800/40">
              <button
                onClick={() => setShowConvert(false)}
                className="px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-800/40 hover:border-zinc-700 rounded-lg transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleConvert}
                disabled={!convName.trim() || converting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium bg-violet-900/50 hover:bg-violet-800/50 border border-violet-700/50 text-violet-200 rounded-lg transition-all disabled:opacity-40"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {converting ? 'CREATING…' : 'CREATE EXPERIMENT'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Wrap in ReactFlowProvider so useNodesState / useEdgesState / onConnect work
export default function SimulatePage() {
  return (
    <ReactFlowProvider>
      <SimulateCanvas />
    </ReactFlowProvider>
  )
}
