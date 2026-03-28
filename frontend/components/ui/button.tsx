import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const base: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.12s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const variants = {
  primary: { background: '#6a8a2a', color: '#fff', border: 'none' },
  secondary: { background: '#eef4d8', color: '#6a8a2a', border: '1px solid #ddd8c0' },
  ghost: { background: 'transparent', color: '#5a6e2a', border: '1px solid #ddd8c0' },
  danger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
}

const sizes = {
  sm: { padding: '5px 12px', fontSize: 12, borderRadius: 6 },
  md: { padding: '7px 16px', fontSize: 13, borderRadius: 8 },
  lg: { padding: '9px 20px', fontSize: 14, borderRadius: 8 },
}

export function Button({ variant = 'primary', size = 'md', style, children, ...props }: ButtonProps) {
  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
