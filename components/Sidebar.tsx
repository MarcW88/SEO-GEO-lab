'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FlaskConical, Network, Beaker } from 'lucide-react'
import { cn } from '@/lib/utils'
import { experiments } from '@/lib/data'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Overview' },
  { href: '/experiments', icon: FlaskConical, label: 'Experiments' },
  { href: '/map', icon: Network, label: 'Map' },
]

const stats = [
  {
    label: 'Total',
    value: experiments.length,
    color: 'text-zinc-200',
  },
  {
    label: 'Validated',
    value: experiments.filter((e) => e.status === 'validated').length,
    color: 'text-emerald-400',
  },
  {
    label: 'Production',
    value: experiments.filter((e) => e.status === 'production').length,
    color: 'text-violet-400',
  },
  {
    label: 'Testing',
    value: experiments.filter((e) => e.status === 'testing').length,
    color: 'text-blue-400',
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-zinc-800/80 flex flex-col h-screen sticky top-0 bg-zinc-950 shrink-0">
      <div className="px-4 py-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Beaker className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100 leading-tight tracking-tight">
              SEO / GEO Lab
            </div>
            <div className="text-[11px] text-zinc-500 leading-tight">R&D Knowledge Map</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-indigo-400' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800/80 space-y-3">
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Lab Stats
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900/80 rounded-lg px-3 py-2 border border-zinc-800/60">
              <div className={cn('text-xl font-bold leading-tight', color)}>{value}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
