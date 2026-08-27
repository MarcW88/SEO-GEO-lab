import Link from 'next/link'
import { Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { StatusBadge, DecisionBadge } from '@/components/StatusBadge'
import { CapabilityBar } from '@/components/CapabilityBar'
import { getExperiments, getCapabilities } from '@/lib/db'
import { STATUS_CONFIG, formatDate } from '@/lib/utils'
import type { ExperimentStatus } from '@/lib/types'

const statusOrder: ExperimentStatus[] = [
  'production',
  'validated',
  'testing',
  'idea',
  'paused',
  'failed',
  'archived',
]

const STAT_META = [
  { label: 'Programs', color: 'text-cyan-300', bg: 'bg-cyan-950/20', border: 'border-cyan-900/30', filter: () => true },
  { label: 'Deployed', color: 'text-violet-400', bg: 'bg-violet-950/30', border: 'border-violet-900/40', filter: (e: { status: string }) => e.status === 'production' },
  { label: 'Validated', color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-900/40', filter: (e: { status: string }) => e.status === 'validated' },
  { label: 'Running', color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-900/40', filter: (e: { status: string }) => e.status === 'testing' },
  { label: 'Initialized', color: 'text-zinc-400', bg: 'bg-zinc-800/40', border: 'border-zinc-700/40', filter: (e: { status: string }) => e.status === 'idea' },
  { label: 'Derezzed', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-900/30', filter: (e: { status: string }) => e.status === 'failed' || e.status === 'archived' },
]

export default async function DashboardPage() {
  const [experiments, capabilities] = await Promise.all([getExperiments(), getCapabilities()])

  const statCards = STAT_META.map((m) => ({ ...m, value: experiments.filter(m.filter).length }))
  const needAttention = experiments.filter(
    (e) =>
      (e.status === 'validated' && (e.decision === 'deepen' || e.decision === 'industrialize')) ||
      e.status === 'paused'
  )
  const recent = [...experiments]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-widest font-mono">CONTROL ROOM</h1>
          <p className="text-xs text-cyan-800 mt-1 font-mono">
            {experiments.length} programs across {capabilities.length} function{capabilities.length !== 1 ? 's' : ''} — The Grid
          </p>
        </div>
        <Link
          href="/experiments"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-700/40 hover:border-cyan-600/60 text-cyan-300 text-xs font-mono font-medium rounded-lg transition-all tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          INITIALIZE
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {statCards.map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${bg} ${border}`}
          >
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-3 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400/80 uppercase tracking-wider font-mono">
                Require Attention
              </h2>
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full ml-1">
                {needAttention.length}
              </span>
            </div>
            <div className="space-y-2">
              {needAttention.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiments/${exp.id}`}
                  className="group flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={exp.status} />
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                      {exp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {exp.decision && <DecisionBadge decision={exp.decision} />}
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                Recent Activity
              </h2>
              <Link href="/experiments" className="text-xs text-cyan-700 hover:text-cyan-500 flex items-center gap-1 font-mono">
                All simulations <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiments/${exp.id}`}
                  className="group flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/70 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm">{STATUS_CONFIG[exp.status].icon}</span>
                    <span className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate">{exp.name}</span>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0 ml-2">{formatDate(exp.updated_at)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-4 font-mono">
            Functions
          </h2>
          <div className="space-y-5">
            {capabilities.map((cap) => {
              const count = experiments.filter((e) => e.capability_id === cap.id).length
              return (
                <CapabilityBar
                  key={cap.id}
                  name={cap.name}
                  maturity={cap.maturity}
                  color={cap.color}
                  count={count}
                />
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
            <div className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-3 font-mono">
              Grid Status
            </div>
            {statusOrder.map((status) => {
              const count = experiments.filter((e) => e.status === status).length
              if (count === 0) return null
              const cfg = STATUS_CONFIG[status]
              return (
                <div key={status} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{cfg.icon}</span>
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 rounded-full bg-zinc-800" style={{ width: 60 }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / experiments.length) * 100}%`,
                          backgroundColor: cfg.color.includes('cyan')
                            ? '#22d3ee'
                            : cfg.color.includes('emerald')
                            ? '#10b981'
                            : cfg.color.includes('violet')
                            ? '#8b5cf6'
                            : cfg.color.includes('red')
                            ? '#ef4444'
                            : cfg.color.includes('amber')
                            ? '#f59e0b'
                            : '#52525b',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-4 text-right">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
