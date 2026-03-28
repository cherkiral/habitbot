interface ProgressProps {
  value: number
  max?: number
  color?: string
  height?: number
  style?: React.CSSProperties
}

export function Progress({ value, max = 100, color = '#6a8a2a', height = 6, style }: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div style={{ width: '100%', borderRadius: 99, overflow: 'hidden', background: '#e8e4d0', height, ...style }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        borderRadius: 99,
        background: color,
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}
