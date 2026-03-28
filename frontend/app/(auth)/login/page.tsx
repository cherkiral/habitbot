'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      setError('Неверный email или пароль')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: '#faf8f0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: '#6a8a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 16px',
          }}>🌿</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#2a3010', letterSpacing: '-0.5px' }}>
            Вход в HabitBot
          </h1>
          <p style={{ fontSize: 13, color: '#8a9060', marginTop: 4 }}>Трекер на пути к цели</p>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #ddd8c0',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 2px 8px rgba(42,48,16,.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Пароль" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
            <Button type="submit" style={{ width: '100%' }} disabled={isLoading}>
              {isLoading ? 'Входим...' : 'Войти'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#8a9060', marginTop: 16 }}>
            Нет аккаунта?{' '}
            <Link href="/register" style={{ color: '#6a8a2a', fontWeight: 500 }}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
