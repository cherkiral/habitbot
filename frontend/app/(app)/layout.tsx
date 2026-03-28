'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuth } from '@/store/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Ждём гидрации Zustand из localStorage перед проверкой токена.
    // Без этой проверки при обновлении страницы token === null пока
    // persist не восстановит состояние, и layout редиректит на /login.
    if (!_hasHydrated) return
    if (!token) router.replace('/login')
  }, [token, _hasHydrated, router])

  // Пока гидрация не завершена — ничего не рендерим (избегаем флicker)
  if (!_hasHydrated) return null
  if (!token) return null

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#faf8f0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
