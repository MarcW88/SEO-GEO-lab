import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StatusBadge, DecisionBadge, ValueStars } from './StatusBadge'
import { formatDate } from '@/lib/utils'
import { capabilities } from '@/lib/data'
import type { Experiment } from '@/lib/types'

interface ExperimentCardProps {
  experiment: Experiment
  compact?: boolean
}

export function ExperimentCard({ experiment, compact = false }: ExperimentCardProps) {
  const capability = capabilities.find((c) => c.id === experiment.capability_id)

  return (
    <Link
      href={`/experiments/${experiment.id}`}
      className="group block bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={experiment.status} />
            {experiment.decision && (
              <DecisionBadge decision={experiment.decision} />
            )}
          </div>

          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug">
            {experiment.name}
          </h3>

          {!compact && (
            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
              {experiment.question}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5">
            {capability && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{
                  color: capability.color,
                  backgroundColor: `${capability.color}18`,
                }}
              >
                {capability.name}
              </span>
            )}
            <ValueStars value={experiment.value} />
            <span className="text-[11px] text-zinc-600 ml-auto">
              {formatDate(experiment.updated_at)}
            </span>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>
    </Link>
  )
}
