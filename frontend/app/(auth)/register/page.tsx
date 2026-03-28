'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RegisterPage() {
  const { register, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(email, password, username || undefined)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
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
          <h1 className="text-xl font-semibold text-primary tracking-tight">Создать аккаунт</h1>
          <p className="text-sm text-muted mt-1">Начни путь к цели сегодня</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Имя (необязательно)" value={username}
              onChange={e => setUsername(e.target.value)} placeholder="Кирилл" />
            <Input label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Пароль" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов" required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Создаём...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-4">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}