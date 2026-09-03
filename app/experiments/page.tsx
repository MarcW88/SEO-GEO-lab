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
      const q = search.toLowerCase()
      const matchesSearch =
        !search ||
        (exp.name ?? '').toLowerCase().includes(q) ||
        (exp.question ?? '').toLowerCase().includes(q) ||
        (exp.tags ?? []).some((t) => t.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter
      const matchesCap = capabilityFilter === 'all' || exp.capability_id === capabilityFilter
      const matchesDecision =
        decisionFilter === 'all' ||
        (decisionFilter === 'none' ? !exp.decision : exp.decision === decisionFilter)
      return matchesSearch && matchesStatus && matchesCap && matchesDecision
    })
  }, [experiments, search, statusFilter, capabilityFilter, decisionFilter])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-widest font-mono">SIMULATIONS</h1>
          <p className="text-xs text-cyan-800 mt-1 font-mono">
            {filtered.length} of {experiments.length} simulation{experiments.length !== 1 ? 's' : ''} in the Lab
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/experiments/${exp.id}`}
                          className="text-sm font-medium text-zinc-200 group-hover:text-cyan-100 transition-colors line-clamp-1"
                        >
                          {exp.name}
                        </Link>
                        {exp.linkedin_url && (
                          <a
                            href={exp.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={exp.linkedin_label ?? 'Source LinkedIn'}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3 fill-blue-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          </a>
                        )}
                      </div>
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
