import { cn, STATUS_CONFIG, DECISION_CONFIG } from '@/lib/utils'
import type { ExperimentStatus, ExperimentDecision } from '@/lib/types'

interface StatusBadgeProps {
  status: ExperimentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.bg,
        cfg.color,
        cfg.border,
        className
      )}
    >
      <span className="text-[10px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

interface DecisionBadgeProps {
  decision: ExperimentDecision
  className?: string
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
  if (!decision) return null
  const cfg = DECISION_CONFIG[decision]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
        cfg.bg,
        cfg.color,
        className
      )}
    >
      {cfg.label}
    </span>
  )
}

interface ValueStarsProps {
  value: number
  max?: number
}

export function ValueStars({ value, max = 5 }: ValueStarsProps) {
  return (
    <span className="text-sm tracking-tighter">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < value ? 'text-amber-400' : 'text-zinc-700'}>
          ★
        </span>
      ))}
    </span>
  )
}
