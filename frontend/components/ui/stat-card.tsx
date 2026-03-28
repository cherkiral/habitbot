interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
}

const deltaColors = { up: '#16a34a', down: '#dc2626', neutral: '#b0b890' }

export function StatCard({ label, value, unit, delta, deltaType = 'neutral' }: StatCardProps) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ddd8c0',
      borderRadius: 10,
      padding: 16,
      boxShadow: '0 1px 3px rgba(42,48,16,.06)',
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8a9060', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 600, color: '#2a3010', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: '#b0b890', marginLeft: 4 }}>{unit}</span>}
      </p>
      {delta && (
        <p style={{ fontSize: 11, marginTop: 6, color: deltaColors[deltaType] }}>{delta}</p>
      )}
    </div>
  )
}
