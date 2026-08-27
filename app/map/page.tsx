'use client'

import dynamic from 'next/dynamic'
import { Network } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-600">
        <Network className="w-8 h-8 animate-pulse text-cyan-700" />
        <span className="text-sm text-cyan-700 font-mono tracking-wider">Initializing Grid…</span>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-cyan-900/25 flex items-center justify-between shrink-0" style={{ boxShadow: '0 1px 0 rgba(34,211,238,0.04)' }}>
        <div>
          <h1 className="text-base font-bold text-cyan-300 tracking-widest font-mono">THE GRID</h1>
          <p className="text-xs text-cyan-800 mt-0.5 font-mono">
            Knowledge graph — established programs, simulations and functions
          </p>
        </div>
      </div>
      <div className="flex-1">
        <MapView />
      </div>
    </div>
  )
}
