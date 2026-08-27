'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FlaskConical, Network, Beaker } from 'lucide-react'
import { cn } from '@/lib/utils'
import { experiments } from '@/lib/data'
import { STATUS_CONFIG } from '@/lib/utils'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Overview' },
  { href: '/experiments', icon: FlaskConical, label: 'Experiments' },
  { href: '/map', icon: Network, label: 'Map' },
]

const quickStats = [
  {
    label: 'total',
    get: () => experiments.length,
    color: 'text-zinc-400',
  },
  {
    label: 'prod.',
    get: () => experiments.filter((e) => e.status === 'production').length,
    color: 'text-violet-400',
  },
  {
    label: 'validated',
    get: () => experiments.filter((e) => e.status === 'validated').length,
    color: 'text-emerald-400',
  },
  {
    label: 'testing',
    get: () => experiments.filter((e) => e.status === 'testing').length,
    color: 'text-blue-400',
  },
]

export default function TopNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur sticky top-0 z-50 shrink-0">
      <div className="flex items-center h-12 px-5 gap-5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Beaker className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight whitespace-nowrap">
            SEO / GEO Lab
          </span>
        </div>

        <div className="w-px h-5 bg-zinc-800 shrink-0" />

        <nav className="flex items-center gap-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-indigo-400' : '')} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {quickStats.map(({ label, get, color }) => {
            const value = get()
            return (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn('text-sm font-semibold tabular-nums', color)}>{value}</span>
                <span className="text-xs text-zinc-600">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
