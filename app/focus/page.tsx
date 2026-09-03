import Link from 'next/link'
import { Target, TrendingUp, HelpCircle, PauseCircle, Archive } from 'lucide-react'
import { getExperiments, getCapabilities } from '@/lib/db'
import { StatusBadge, DecisionBadge, ValueStars } from '@/components/StatusBadge'
import CreateTicketButton from '@/components/CreateTicketButton'
import type { Experiment, ExperimentDecision, ExperimentStatus } from '@/lib/types'

const DECISION_BONUS: Partial<Record<NonNullable<ExperimentDecision>, number>> = {
  industrialize: 20, deepen: 15, keep: 5, merge: 3, replace: -5, kill: -20,
}
const STATUS_FACTOR: Record<ExperimentStatus, number> = {
  testing: 1.5, validated: 1.3, idea: 1.0, paused: 0.6,
  production: 0.3, failed: 0.1, archived: 0,
}

function priorityScore(e: Experiment): number {
  const db = e.decision ? (DECISION_BONUS[e.decision] ?? 0) : 0
  return (e.value * (6 - e.maturity) * STATUS_FACTOR[e.status]) + db
}

type Group = {
  id: string
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  border: string
  badge: string
  exps: Experiment[]
}

function buildGroups(exps: Experiment[]): Group[] {
  const score = (e: Experiment) => priorityScore(e)
  const sorted = [...exps].sort((a, b) => score(b) - score(a))

  const tier1 = sorted.filter(e =>
    e.decision === 'industrialize' ||
    (e.value >= 4 && e.maturity <= 3 && ['testing', 'validated', 'idea'].includes(e.status))
  )
  const tier1ids = new Set(tier1.map(e => e.id))

  const tier2 = sorted.filter(e =>
    !tier1ids.has(e.id) &&
    e.value >= 3 &&
    ['testing', 'idea', 'validated'].includes(e.status) &&
    e.decision !== 'kill'
  )
  const tier2ids = new Set(tier2.map(e => e.id))

  const tier3 = sorted.filter(e =>
    !tier1ids.has(e.id) && !tier2ids.has(e.id) &&
    ['validated', 'testing'].includes(e.status) &&
    !e.decision &&
    e.value >= 2
  )
  const tier3ids = new Set(tier3.map(e => e.id))

  const tier4 = sorted.filter(e =>
    !tier1ids.has(e.id) && !tier2ids.has(e.id) && !tier3ids.has(e.id) &&
    e.status === 'paused' && e.value >= 2
  )
  const tier4ids = new Set(tier4.map(e => e.id))

  const tier5 = sorted.filter(e =>
    !tier1ids.has(e.id) && !tier2ids.has(e.id) && !tier3ids.has(e.id) && !tier4ids.has(e.id) &&
    (e.decision === 'kill' || ['failed', 'archived'].includes(e.status) || e.value <= 1)
  )

  return [
    {
      id: 'tier1', label: 'Priorité haute', sublabel: 'À lancer ou industrialiser maintenant',
      icon: Target, color: 'text-cyan-400', border: 'border-cyan-900/50', badge: 'bg-cyan-950/60 text-cyan-400',
      exps: tier1,
    },
    {
      id: 'tier2', label: 'À faire avancer', sublabel: 'Valeur forte, à approfondir',
      icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-900/40', badge: 'bg-emerald-950/50 text-emerald-400',
      exps: tier2,
    },
    {
      id: 'tier3', label: 'À décider', sublabel: 'Résultats disponibles — décision manquante',
      icon: HelpCircle, color: 'text-amber-400', border: 'border-amber-900/40', badge: 'bg-amber-950/40 text-amber-400',
      exps: tier3,
    },
    {
      id: 'tier4', label: 'En pause — à relancer ?', sublabel: 'Valeur potentielle, déprioritisé',
      icon: PauseCircle, color: 'text-zinc-500', border: 'border-zinc-800/50', badge: 'bg-zinc-900/50 text-zinc-500',
      exps: tier4,
    },
    {
      id: 'tier5', label: 'Basse priorité / À archiver', sublabel: 'Tuer, archiver ou valeur insuffisante',
      icon: Archive, color: 'text-zinc-700', border: 'border-zinc-900/30', badge: 'bg-zinc-950/50 text-zinc-600',
      exps: tier5,
    },
  ].filter(g => g.exps.length > 0)
}

export default async function FocusPage() {
  const [experiments, capabilities] = await Promise.all([getExperiments(), getCapabilities()])
  const capMap = Object.fromEntries(capabilities.map(c => [c.id, c]))
  const groups = buildGroups(experiments)

  const activeCount = groups.slice(0, 2).reduce((s, g) => s + g.exps.length, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 tracking-widest font-mono">FOCUS</h1>
        <p className="text-xs text-cyan-800 mt-1 font-mono">
          {activeCount} simulation{activeCount !== 1 ? 's' : ''} à fort impact · {experiments.length} au total
        </p>
      </div>

      <div className="space-y-10">
        {groups.map((group) => {
          const Icon = group.icon
          return (
            <section key={group.id}>
              <div className="flex items-center gap-2.5 mb-4">
                <Icon className={`w-4 h-4 ${group.color}`} />
                <div>
                  <h2 className={`text-sm font-semibold ${group.color}`}>{group.label}</h2>
                  <p className="text-[10px] text-zinc-600">{group.sublabel}</p>
                </div>
                <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-full ${group.badge}`}>
                  {group.exps.length}
                </span>
              </div>

              <div className={`border ${group.border} rounded-xl overflow-hidden divide-y divide-zinc-900`}>
                {group.exps.map((exp) => {
                  const cap = capMap[exp.capability_id]
                  const score = Math.round(priorityScore(exp))
                  return (
                    <div key={exp.id} className="flex items-center gap-4 px-4 py-3 bg-zinc-950/60 hover:bg-zinc-900/60 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/experiments/${exp.id}`}
                            className="text-sm font-medium text-zinc-200 group-hover:text-cyan-200 transition-colors truncate"
                          >
                            {exp.name}
                          </Link>
                          {cap && (
                            <span
                              className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                              style={{ color: cap.color, backgroundColor: `${cap.color}15` }}
                            >
                              {cap.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={exp.status} />
                          {exp.decision && <DecisionBadge decision={exp.decision} />}
                          <ValueStars value={exp.value} />
                          {exp.next_experiment && (
                            <span className="text-[10px] text-zinc-600 truncate max-w-[180px]">
                              → {exp.next_experiment}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-xs font-mono text-zinc-600">{score}</span>
                          <span className="text-[9px] text-zinc-800 uppercase tracking-wider">score</span>
                        </div>
                        <CreateTicketButton
                          defaultTitle={exp.name}
                          defaultDescription={exp.question}
                          defaultTags={exp.tags}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
