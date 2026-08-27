interface CapabilityBarProps {
  name: string
  maturity: number
  color: string
  count: number
}

export function CapabilityBar({ name, maturity, color, count }: CapabilityBarProps) {
  const filled = Math.round(maturity / 10)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-200">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{count} exp.</span>
          <span className="text-xs font-mono text-zinc-400">{maturity}%</span>
        </div>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-sm transition-all"
            style={{
              backgroundColor: i < filled ? color : '#27272a',
              opacity: i < filled ? 0.85 : 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
