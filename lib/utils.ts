import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ExperimentStatus, ExperimentDecision } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function renderStars(value: number, max = 5): string {
  return '★'.repeat(value) + '☆'.repeat(max - value)
}

export const STATUS_CONFIG: Record<
  ExperimentStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  idea: {
    label: 'Idea',
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60',
    border: 'border-zinc-700',
    icon: '💡',
  },
  testing: {
    label: 'Testing',
    color: 'text-blue-400',
    bg: 'bg-blue-950/60',
    border: 'border-blue-900',
    icon: '🧪',
  },
  validated: {
    label: 'Validated',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-900',
    icon: '✅',
  },
  production: {
    label: 'Production',
    color: 'text-violet-400',
    bg: 'bg-violet-950/60',
    border: 'border-violet-900',
    icon: '⚙️',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bg: 'bg-red-950/60',
    border: 'border-red-900',
    icon: '❌',
  },
  paused: {
    label: 'Paused',
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-900',
    icon: '🧊',
  },
  archived: {
    label: 'Archived',
    color: 'text-zinc-500',
    bg: 'bg-zinc-900/60',
    border: 'border-zinc-800',
    icon: '🗑',
  },
}

export const DECISION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  keep: { label: 'Keep', color: 'text-zinc-300', bg: 'bg-zinc-800' },
  deepen: { label: 'Deepen', color: 'text-cyan-400', bg: 'bg-cyan-950' },
  industrialize: {
    label: 'Industrialize',
    color: 'text-violet-400',
    bg: 'bg-violet-950',
  },
  merge: { label: 'Merge', color: 'text-amber-400', bg: 'bg-amber-950' },
  replace: { label: 'Replace', color: 'text-orange-400', bg: 'bg-orange-950' },
  kill: { label: 'Kill', color: 'text-red-400', bg: 'bg-red-950' },
}

export const STATUSES: ExperimentStatus[] = [
  'idea',
  'testing',
  'validated',
  'production',
  'failed',
  'paused',
  'archived',
]

export const DECISIONS: ExperimentDecision[] = [
  'keep',
  'deepen',
  'industrialize',
  'merge',
  'replace',
  'kill',
]
