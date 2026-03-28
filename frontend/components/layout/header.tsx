'use client'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  action?: { label: string; onClick: () => void }
}

export function Header({ title, action }: HeaderProps) {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="h-14 px-6 flex items-center gap-4 border-b border-border" style={{ background: 'var(--bg-sidebar)' }}>
      <h1 className="text-sm font-medium text-primary flex-1">{title}</h1>
      <span className="text-xs font-mono text-hint">{today}</span>
      {action && (
        <Button size="sm" variant="ghost" onClick={action.onClick}>
          <Plus size={13} className="mr-1" />
          {action.label}
        </Button>
      )}
    </header>
  )
}