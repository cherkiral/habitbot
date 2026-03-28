interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #ddd8c0',
  borderRadius: 10,
  padding: 16,
  boxShadow: '0 1px 3px rgba(42,48,16,.06)',
}

export function Card({ children, style, className }: CardProps) {
  return (
    <div style={{ ...cardStyle, ...style }} className={className}>
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a9060' }}>
      {children}
    </span>
  )
}
