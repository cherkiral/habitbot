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

const S = {
  sidebar: {
    width: 224,
    minWidth: 224,
    height: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    background: '#f3f0e4',
    borderRight: '1px solid #ddd8c0',
    fontFamily: "'DM Sans', sans-serif",
  },
  logo: {
    padding: '16px',
    borderBottom: '1px solid #ddd8c0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 28, height: 28,
    borderRadius: 8,
    background: '#6a8a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },
  logoText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2a3010',
    letterSpacing: '-0.3px',
  },
  nav: {
    flex: 1,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    overflowY: 'auto' as const,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#b0b890',
    padding: '8px 10px 4px',
  },
  navItem: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
    borderRadius: 7,
    fontSize: 13,
    color: active ? '#2a3010' : '#8a9060',
    background: active ? '#e5e0cc' : 'transparent',
    fontWeight: active ? 500 : 400,
    textDecoration: 'none',
    transition: 'all 0.12s',
    cursor: 'pointer',
  }),
  user: {
    padding: '12px',
    borderTop: '1px solid #ddd8c0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: '#3a4a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: '#fff',
    fontWeight: 600,
    flexShrink: 0,
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'HB'

  return (
    <aside style={S.sidebar}>
      <div style={S.logo}>
        <div style={S.logoIcon}>🌿</div>
        <span style={S.logoText}>HabitBot</span>
      </div>

      <nav style={S.nav}>
        <div style={S.navLabel}>Главное</div>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={S.navItem(active)}>
              <Icon size={15} color={active ? '#6a8a2a' : '#8a9060'} />
              {label}
            </Link>
          )
        })}

        <div style={{ ...S.navLabel, marginTop: 12 }}>Прогресс</div>
        {navBottom.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={S.navItem(active)}>
              <Icon size={15} color={active ? '#6a8a2a' : '#8a9060'} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={S.user}>
        <div style={S.avatar}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#2a3010', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || user?.email}
          </p>
          <p style={{ fontSize: 11, color: '#b0b890' }}>Жму к цели 💪</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b890', padding: 0 }}>
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
