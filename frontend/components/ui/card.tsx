interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const p = { sm: 'p-3', md: 'p-4', lg: 'p-5' }[padding]
  return (
    <div className={g-card border border-border rounded-lg shadow-sm  }>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={lex items-center justify-between mb-3 }>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
      {children}
    </span>
  )
}