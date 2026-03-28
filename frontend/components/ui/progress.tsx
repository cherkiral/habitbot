interface ProgressProps {
  value: number
  max?: number
  color?: string
  height?: number
  className?: string
}

export function Progress({ value, max = 100, color = 'var(--accent)', height = 6, className = '' }: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div
      className={w-full rounded-full overflow-hidden }
      style={{ height, background: 'var(--border-light)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: ${pct}%, background: color }}
      />
    </div>
  )
}