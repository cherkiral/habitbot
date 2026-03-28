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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'var(--accent)' }}>
            🌿
          </div>
          <h1 className="text-xl font-semibold text-primary tracking-tight">Вход в HabitBot</h1>
          <p className="text-sm text-muted mt-1">Трекер на пути к цели</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Пароль" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Входим...' : 'Войти'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-4">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-accent hover:underline font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}