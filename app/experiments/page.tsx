'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { StatusBadge, DecisionBadge, ValueStars } from '@/components/StatusBadge'
import { STATUS_CONFIG, STATUSES, formatDate, cn } from '@/lib/utils'
import type { ExperimentStatus, Experiment, Capability } from '@/lib/types'

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all')
  const [capabilityFilter, setCapabilityFilter] = useState<string>('all')
  const [decisionFilter, setDecisionFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then(({ experiments, capabilities }) => {
        setExperiments(experiments ?? [])
        setCapabilities(capabilities ?? [])
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    return experiments.filter((exp) => {
      const matchesSearch =
        !search ||
        exp.name.toLowerCase().includes(search.toLowerCase()) ||
        exp.question.toLowerCase().includes(search.toLowerCase()) ||
        exp.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter
      const matchesCap = capabilityFilter === 'all' || exp.capability_id === capabilityFilter
      const matchesDecision =
        decisionFilter === 'all' ||
        (decisionFilter === 'none' ? !exp.decision : exp.decision === decisionFilter)
      return matchesSearch && matchesStatus && matchesCap && matchesDecision
    })
  }, [search, statusFilter, capabilityFilter, decisionFilter])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-widest font-mono">SIMULATIONS</h1>
          <p className="text-xs text-cyan-800 mt-1 font-mono">
            {filtered.length} of {experiments.length} programs active on the grid
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Scan simulations, hypotheses, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-800/50 focus:ring-1 focus:ring-cyan-900/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                statusFilter === 'all'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              )}
            >
              All status
            </button>
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                    statusFilter === s
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  )}
                >
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
          </div>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCapabilityFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                capabilityFilter === 'all'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              )}
            >
              All functions
            </button>
            {capabilities.map((cap) => (
              <button
                key={cap.id}
                onClick={() => setCapabilityFilter(cap.id === capabilityFilter ? 'all' : cap.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                  capabilityFilter === cap.id
                    ? 'border-zinc-600 text-zinc-100 bg-zinc-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                )}
                style={capabilityFilter === cap.id ? { color: cap.color, borderColor: `${cap.color}50` } : {}}
              >
                {cap.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">No experiments match your filters</p>
        </div>
      ) : (
        <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-[40%]">
                  Experiment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Capability
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Decision
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => {
                const cap = capabilities.find((c) => c.id === exp.capability_id)
                return (
                  <tr
                    key={exp.id}
                    className={cn(
                      'group border-b border-zinc-800/40 last:border-0 hover:bg-zinc-900/60 transition-colors',
                      i % 2 === 0 ? '' : 'bg-zinc-900/20'
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="text-sm font-medium text-zinc-200 group-hover:text-white hover:text-indigo-300 transition-colors line-clamp-1"
                      >
                        {exp.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {cap && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-md"
                          style={{ color: cap.color, backgroundColor: `${cap.color}18` }}
                        >
                          {cap.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="px-4 py-3">
                      {exp.decision ? (
                        <DecisionBadge decision={exp.decision} />
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ValueStars value={exp.value} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 whitespace-nowrap">
                      {formatDate(exp.updated_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
