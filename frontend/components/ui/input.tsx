import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-secondary">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 text-sm bg-card border rounded text-primary placeholder:text-hint outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-400' : 'border-border'} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
