'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FlaskConical, Network, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Control Room' },
  { href: '/experiments', icon: FlaskConical, label: 'Simulations' },
  { href: '/map', icon: Network, label: 'The Grid' },
]

interface Stats { total: number; prod: number; validated: number; testing: number }

export default function TopNav() {
  const pathname = usePathname()
  const [stats, setStats] = useState<Stats>({ total: 0, prod: 0, validated: 0, testing: 0 })

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then(({ experiments = [] }) => {
        setStats({
          total: experiments.length,
          prod: experiments.filter((e: { status: string }) => e.status === 'production').length,
          validated: experiments.filter((e: { status: string }) => e.status === 'validated').length,
          testing: experiments.filter((e: { status: string }) => e.status === 'testing').length,
        })
      })
      .catch(() => {})
  }, [])

  const quickStats = [
    { label: 'programs', value: stats.total, color: 'text-cyan-300' },
    { label: 'deployed', value: stats.prod, color: 'text-violet-400' },
    { label: 'validated', value: stats.validated, color: 'text-emerald-400' },
    { label: 'running', value: stats.testing, color: 'text-cyan-400' },
  ]

  return (
    <header className="border-b border-cyan-900/30 bg-[#050508]/95 backdrop-blur sticky top-0 z-50 shrink-0" style={{ boxShadow: '0 1px 0 rgba(34,211,238,0.06)' }}>
      <div className="flex items-center h-12 px-5 gap-5">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-cyan-300 tracking-widest font-mono">
              GRID
            </span>
            <span className="text-[9px] text-cyan-700 tracking-wider uppercase font-mono">
              Research System
            </span>
          </div>
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
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-900/50 font-medium'
                    : 'text-zinc-500 hover:text-cyan-300/70 hover:bg-cyan-950/20'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-cyan-400' : '')} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {quickStats.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn('text-sm font-semibold tabular-nums', color)}>{value}</span>
              <span className="text-xs text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
