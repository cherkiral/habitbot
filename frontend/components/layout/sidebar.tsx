'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Apple, Activity, Scale,
  BookOpen, Trophy, BarChart3, Settings, LogOut, Droplets
} from 'lucide-react'
import { useAuth } from '@/store/auth'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/food', icon: Apple, label: 'Питание' },
  { href: '/activity', icon: Activity, label: 'Активность' },
  { href: '/water', icon: Droplets, label: 'Вода' },
  { href: '/weight', icon: Scale, label: 'Вес' },
  { href: '/recipes', icon: BookOpen, label: 'Рецепты' },
]

const navBottom = [
  { href: '/achievements', icon: Trophy, label: 'Достижения' },
  { href: '/reports', icon: BarChart3, label: 'Отчёты' },
  { href: '/settings', icon: Settings, label: 'Настройки' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() ?? 'HB'

  return (
    <aside className="w-56 h-full flex flex-col border-r border-border" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'var(--accent)', color: 'white' }}>
          🌿
        </div>
        <span className="text-sm font-semibold text-primary tracking-tight">HabitBot</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-hint px-2 py-2 mt-1">Главное</p>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={lex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors
                }
            >
              <Icon size={15} className={active ? 'text-accent' : ''} />
              {label}
            </Link>
          )
        })}

        <p className="text-xs font-semibold uppercase tracking-wider text-hint px-2 py-2 mt-3">Прогресс</p>
        {navBottom.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={lex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors
                }
            >
              <Icon size={15} className={active ? 'text-accent' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--accent-dark)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary truncate">{user?.username || user?.email}</p>
            <p className="text-xs text-hint">Жму к цели 💪</p>
          </div>
          <button onClick={logout} className="text-hint hover:text-red-500 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}