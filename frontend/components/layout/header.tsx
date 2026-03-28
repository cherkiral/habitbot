'use client'

interface HeaderProps {
  title: string
  action?: { label: string; onClick: () => void }
}

export function Header({ title, action }: HeaderProps) {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header style={{
      height: 52,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      borderBottom: '1px solid #ddd8c0',
      background: '#f3f0e4',
      flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 14, fontWeight: 500, color: '#2a3010', flex: 1 }}>{title}</h1>
      <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#b0b890' }}>{today}</span>
      {action && (
        <button onClick={action.onClick} style={{
          padding: '5px 12px',
          borderRadius: 7,
          border: '1px solid #ddd8c0',
          background: 'transparent',
          fontSize: 12,
          fontWeight: 500,
          color: '#5a6e2a',
          cursor: 'pointer',
        }}>
          + {action.label}
        </button>
      )}
    </header>
  )
}
