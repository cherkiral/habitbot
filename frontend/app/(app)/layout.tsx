'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuth } from '@/store/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const router = useRouter()
  // Zustand persist читает localStorage только на клиенте.
  // Ждём первого рендера после монтирования — к этому моменту
  // гидрация гарантированно завершена и token уже восстановлен.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!token) router.replace('/login')
  }, [mounted, token, router])

  // До монтирования — пустой экран (не редирект, просто ждём)
  if (!mounted) return null
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
