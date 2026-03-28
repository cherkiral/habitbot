interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  className?: string
}

const deltaColors = {
  up: 'text-green-600',
  down: 'text-red-500',
  neutral: 'text-hint',
}

export function StatCard({ label, value, unit, delta, deltaType = 'neutral', className = '' }: StatCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{label}</p>
      <p className="text-2xl font-semibold text-primary tracking-tight leading-none">
        {value}
        {unit && <span className="text-sm font-normal text-hint ml-1">{unit}</span>}
      </p>
      {delta && (
        <p className={`text-xs mt-1.5 ${deltaColors[deltaType]}`}>{delta}</p>
      )}
    </div>
  )
}
