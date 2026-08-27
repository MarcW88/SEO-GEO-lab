import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Ticket, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { StatusBadge, DecisionBadge, ValueStars } from '@/components/StatusBadge'
import { getExperiment, getCapabilities, getTools } from '@/lib/db'
import { formatDate, cn } from '@/lib/utils'
import type { Learning } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

function LearningItem({ learning }: { learning: Learning }) {
  const icons = {
    finding: <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />,
    blocker: <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />,
  }
  return (
    <div className="flex items-start gap-2.5">
      {icons[learning.type]}
      <span className="text-sm text-zinc-300 leading-relaxed">{learning.text}</span>
    </div>
  )
}

export default async function ExperimentDetailPage({ params }: Props) {
  const { id } = await params
  const [experiment, capabilities, tools] = await Promise.all([
    getExperiment(id),
    getCapabilities(),
    getTools(),
  ])
  if (!experiment) notFound()

  const capability = capabilities.find((c) => c.id === experiment.capability_id)
  const experimentTools = tools.filter((t) => experiment.tool_ids.includes(t.id))
  const relatedIds = experiment.related_ids ?? []

  const allExperiments = relatedIds.length > 0
    ? await (await import('@/lib/db')).getExperiments()
    : []
  const relatedExperiments = allExperiments.filter((e) => relatedIds.includes(e.id))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/experiments"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Experiments
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <StatusBadge status={experiment.status} />
              {experiment.decision && (
                <DecisionBadge decision={experiment.decision} />
              )}
              {capability && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{ color: capability.color, backgroundColor: `${capability.color}18` }}
                >
                  {capability.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight leading-snug">
              {experiment.name}
            </h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-all shrink-0">
            <Ticket className="w-4 h-4" />
            Create ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Question
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed font-medium">{experiment.question}</p>
          </section>

          {experiment.learnings.length > 0 && (
            <section className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Learnings
              </div>
              <div className="space-y-3">
                {experiment.learnings.map((l, i) => (
                  <LearningItem key={i} learning={l} />
                ))}
              </div>
            </section>
          )}

          {experiment.inputs.length > 0 && (
            <section className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Inputs
              </div>
              <div className="flex flex-wrap gap-2">
                {experiment.inputs.map((input) => (
                  <span
                    key={input}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-300"
                  >
                    {input}
                  </span>
                ))}
              </div>
            </section>
          )}

          {experiment.next_experiment && (
            <section className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-5">
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                Next Experiment
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed">{experiment.next_experiment}</p>
            </section>
          )}

          {relatedExperiments.length > 0 && (
            <section>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Related Experiments
              </div>
              <div className="space-y-2">
                {relatedExperiments.map((rel) => {
                  const relCap = capabilities.find((c) => c.id === rel.capability_id)
                  return (
                    <Link
                      key={rel.id}
                      href={`/experiments/${rel.id}`}
                      className="group flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={rel.status} />
                        <span className="text-sm text-zinc-300 group-hover:text-white">{rel.name}</span>
                        {relCap && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ color: relCap.color, backgroundColor: `${relCap.color}15` }}
                          >
                            {relCap.name}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 space-y-4">
            <div>
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Value
              </div>
              <ValueStars value={experiment.value} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Maturity
              </div>
              <ValueStars value={experiment.maturity} />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Decision
              </div>
              {experiment.decision ? (
                <DecisionBadge decision={experiment.decision} />
              ) : (
                <span className="text-xs text-zinc-600">Not set</span>
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Created
              </div>
              <span className="text-xs text-zinc-400">{formatDate(experiment.created_at)}</span>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Updated
              </div>
              <span className="text-xs text-zinc-400">{formatDate(experiment.updated_at)}</span>
            </div>
          </div>

          {experimentTools.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                Tools Used
              </div>
              <div className="space-y-2">
                {experimentTools.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-300">{tool.name}</div>
                      {tool.description && (
                        <div className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">{tool.description}</div>
                      )}
                    </div>
                    {tool.url && (
                      <a href={tool.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-zinc-600 hover:text-zinc-400" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiment.clients.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                Tested On
              </div>
              <div className="space-y-1.5">
                {experiment.clients.map((client) => (
                  <div key={client} className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                    {client}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiment.tags.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {experiment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
