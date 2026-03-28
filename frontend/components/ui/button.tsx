import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-accent-bg text-accent hover:bg-accent-light border border-border',
  ghost: 'bg-transparent border border-border text-secondary hover:bg-hover',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded',
  lg: 'px-5 py-2.5 text-sm rounded-lg',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
