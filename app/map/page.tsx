'use client'

import dynamic from 'next/dynamic'
import { Network } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-600">
        <Network className="w-8 h-8 animate-pulse" />
        <span className="text-sm">Loading map…</span>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Map</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Tools → Experiments → Capabilities — drag to rearrange, scroll to zoom
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-950/60 border border-amber-900/60" />
            Tool
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-950/60 border border-emerald-900/60" />
            Experiment
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-950/40 border border-blue-800/40" />
            Capability
          </div>
        </div>
      </div>
      <div className="flex-1">
        <MapView />
      </div>
    </div>
  )
}
