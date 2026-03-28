'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const ACTIVITY_TYPES = [
  { value: 'walking', label: '🚶 Ходьба' },
  { value: 'running', label: '🏃 Бег' },
  { value: 'cycling', label: '🚴 Велосипед' },
  { value: 'swimming', label: '🏊 Плавание' },
  { value: 'strength', label: '💪 Силовая' },
  { value: 'yoga', label: '🧘 Йога' },
  { value: 'hiking', label: '🥾 Хайкинг' },
  { value: 'other', label: '⚡ Другое' },
]

const S = {
  page: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  content: { flex: 1, overflowY: 'auto' as const, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 20 },
  card: { background: '#fff', border: '1px solid #ddd8c0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(42,48,16,.06)' },
  label: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#8a9060', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #ddd8c0', borderRadius: 8, color: '#2a3010', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#faf8f0' },
  select: { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #ddd8c0', borderRadius: 8, color: '#2a3010', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#faf8f0', cursor: 'pointer' },
  btn: { padding: '10px 24px', background: '#6a8a2a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  statCard: { background: '#fff', border: '1px solid #ddd8c0', borderRadius: 10, padding: 16, textAlign: 'center' as const },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#d97070', fontSize: 12 },
}

export default function ActivityPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ activity_type: 'walking', steps: '', duration_min: '', intensity: 'medium', notes: '' })
  const [showForm, setShowForm] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => api.get('/activity/stats').then(r => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.get('/activity/logs').then(r => r.data),
  })

  const add = useMutation({
    mutationFn: () => api.post('/activity/logs', {
      activity_type: form.activity_type,
      steps: form.steps ? parseInt(form.steps) : undefined,
      duration_min: form.duration_min ? parseInt(form.duration_min) : undefined,
      intensity: form.intensity,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-stats'] })
      qc.invalidateQueries({ queryKey: ['activity-logs'] })
      setForm({ activity_type: 'walking', steps: '', duration_min: '', intensity: 'medium', notes: '' })
      setShowForm(false)
    },
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/activity/logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-stats'] })
      qc.invalidateQueries({ queryKey: ['activity-logs'] })
    },
  })

  const stepsPct = stats?.steps_goal ? Math.min((stats.total_steps_today / stats.steps_goal) * 100, 100) : 0

  return (
    <div style={S.page}>
      <Header title="Активность" action={{ label: 'Добавить', onClick: () => setShowForm(v => !v) }} />
      <div style={S.content}>

        {/* Form */}
        {showForm && (
          <div style={S.card}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2a3010', marginBottom: 16 }}>Новая тренировка</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={S.label}>Тип активности</span>
                <select style={S.select} value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}>
                  {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <span style={S.label}>Интенсивность</span>
                <select style={S.select} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}>
                  <option value="low">Низкая</option>
                  <option value="medium">Средняя</option>
                  <option value="high">Высокая</option>
                </select>
              </div>
              <div>
                <span style={S.label}>Шаги</span>
                <input style={S.input} type="number" placeholder="5000" value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} />
              </div>
              <div>
                <span style={S.label}>Длительность (мин)</span>
                <input style={S.input} type="number" placeholder="30" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={S.label}>Заметка</span>
              <input style={S.input} type="text" placeholder="Утренняя пробежка" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button style={S.btn} onClick={() => add.mutate()} disabled={add.isPending}>
              {add.isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        )}

        {/* Steps */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2a3010' }}>Шаги сегодня</span>
            <span style={{ fontSize: 13, color: '#8a9060' }}>{stats?.total_steps_today?.toLocaleString('ru') ?? 0} / {stats?.steps_goal?.toLocaleString('ru') ?? 10000}</span>
          </div>
          <div style={{ height: 8, background: '#e8e4d0', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${stepsPct}%`, height: '100%', background: '#6a8a2a', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
            <div style={S.statCard}>
              <div style={{ fontSize: 10, color: '#8a9060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Шаги за неделю</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#2a3010' }}>{stats?.total_steps_week?.toLocaleString('ru') ?? 0}</div>
            </div>
            <div style={S.statCard}>
              <div style={{ fontSize: 10, color: '#8a9060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Калории сегодня</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#2a3010' }}>{stats?.total_calories_burned_today?.toFixed(0) ?? 0}</div>
            </div>
            <div style={S.statCard}>
              <div style={{ fontSize: 10, color: '#8a9060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Тренировок за неделю</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#2a3010' }}>{stats?.total_workouts_week ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Log */}
        <div style={S.card}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2a3010', marginBottom: 12 }}>История</p>
          {!logs?.length && (
            <p style={{ fontSize: 13, color: '#b0b890', textAlign: 'center', padding: '20px 0' }}>Нет тренировок</p>
          )}
          {logs?.map((l: any) => {
            const type = ACTIVITY_TYPES.find(t => t.value === l.activity_type)
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0ede4' }}>
                <span style={{ fontSize: 22 }}>{type?.label.split(' ')[0]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#2a3010' }}>{type?.label.slice(type.label.indexOf(' ') + 1)}</p>
                  <p style={{ fontSize: 11, color: '#8a9060' }}>
                    {l.steps ? `${l.steps.toLocaleString('ru')} шагов · ` : ''}
                    {l.duration_min ? `${l.duration_min} мин · ` : ''}
                    {l.calories_burned ? `${l.calories_burned.toFixed(0)} ккал` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 12, color: '#b0b890' }}>
                  {new Date(l.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <button style={S.delBtn} onClick={() => del.mutate(l.id)}>✕</button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
