import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label && (
          <label style={{ fontSize: 12, fontWeight: 500, color: '#5a6e2a' }}>{label}</label>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 13,
            background: '#ffffff',
            border: `1px solid ${error ? '#f87171' : '#ddd8c0'}`,
            borderRadius: 7,
            color: '#2a3010',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            ...style,
          }}
          {...props}
        />
        {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
