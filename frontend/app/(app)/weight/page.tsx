'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const S = {
  page: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  content: { flex: 1, overflowY: 'auto' as const, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 20 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: '#fff', border: '1px solid #ddd8c0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(42,48,16,.06)' },
  label: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#8a9060', marginBottom: 8, display: 'block' },
  input: { width: '100%', padding: '10px 12px', fontSize: 15, border: '1px solid #ddd8c0', borderRadius: 8, color: '#2a3010', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#faf8f0' },
  btn: { width: '100%', padding: '10px', background: '#6a8a2a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 12, fontFamily: "'DM Sans', sans-serif" },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  statCard: { background: '#fff', border: '1px solid #ddd8c0', borderRadius: 10, padding: 16 },
  statLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#8a9060', marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: 600, color: '#2a3010', letterSpacing: '-0.5px', lineHeight: 1 },
  statUnit: { fontSize: 12, fontWeight: 400, color: '#b0b890', marginLeft: 3 },
  statDelta: (pos: boolean) => ({ fontSize: 11, marginTop: 5, color: pos ? '#16a34a' : '#dc2626' }),
  periodBtn: (active: boolean) => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: active ? 600 : 400,
    border: active ? '1px solid #6a8a2a' : '1px solid #ddd8c0',
    background: active ? '#eef4d8' : 'transparent',
    color: active ? '#3a4a1a' : '#8a9060',
    cursor: 'pointer',
  }),
  logRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0ede4' },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#d97070', fontSize: 12, padding: '2px 8px' },
}

const periods = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '3 месяца', days: 90 },
  { label: 'Всё', days: 365 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #ddd8c0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#8a9060', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#2a3010', fontWeight: 600 }}>{payload[0].value} кг</p>
    </div>
  )
}

export default function WeightPage() {
  const qc = useQueryClient()
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [period, setPeriod] = useState(30)
  const [showForm, setShowForm] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['weight-stats'],
    queryFn: () => api.get('/weight/stats').then(r => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['weight-logs', period],
    queryFn: () => {
      const from = new Date()
      from.setDate(from.getDate() - period)
      return api.get('/weight/logs', { params: { from_date: from.toISOString(), limit: 100 } }).then(r => r.data)
    },
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me/profile').then(r => r.data),
  })

  const addLog = useMutation({
    mutationFn: () => api.post('/weight/logs', { weight_kg: parseFloat(weight), notes: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight-logs'] })
      qc.invalidateQueries({ queryKey: ['weight-stats'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
      setWeight('')
      setNote('')
      setShowForm(false)
    },
  })

  const deleteLog = useMutation({
    mutationFn: (id: string) => api.delete(`/weight/logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight-logs'] })
      qc.invalidateQueries({ queryKey: ['weight-stats'] })
    },
  })

  const chartData = [...(logs || [])].reverse().map((l: any) => ({
    date: new Date(l.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    weight: l.weight_kg,
  }))

  const minW = chartData.length ? Math.min(...chartData.map(d => d.weight)) - 1 : 0
  const maxW = chartData.length ? Math.max(...chartData.map(d => d.weight)) + 1 : 100

  return (
    <div style={S.page}>
      <Header
        title="Вес"
        action={{ label: 'Добавить', onClick: () => setShowForm(v => !v) }}
      />
      <div style={S.content}>

        {/* Form */}
        {showForm && (
          <div style={S.card}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2a3010', marginBottom: 14 }}>Новое взвешивание</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={S.label}>Вес (кг)</span>
                <input style={S.input} type="number" step="0.1" placeholder="90.0"
                  value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div>
                <span style={S.label}>Заметка (необязательно)</span>
                <input style={S.input} type="text" placeholder="Утреннее взвешивание"
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
            <button style={S.btn} onClick={() => weight && addLog.mutate()} disabled={!weight || addLog.isPending}>
              {addLog.isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={S.statRow}>
          <div style={S.statCard}>
            <div style={S.statLabel}>Текущий вес</div>
            <div style={S.statVal}>{stats?.current_weight_kg?.toFixed(1) ?? '—'}<span style={S.statUnit}>кг</span></div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Цель</div>
            <div style={S.statVal}>{stats?.target_weight_kg?.toFixed(1) ?? '—'}<span style={S.statUnit}>кг</span></div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>За неделю</div>
            <div style={S.statVal}>
              {stats?.delta_week_kg != null ? (
                <span style={{ color: stats.delta_week_kg < 0 ? '#16a34a' : '#dc2626' }}>
                  {stats.delta_week_kg > 0 ? '+' : ''}{stats.delta_week_kg}<span style={S.statUnit}>кг</span>
                </span>
              ) : '—'}
            </div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>До цели</div>
            <div style={S.statVal}>
              {stats?.current_weight_kg && stats?.target_weight_kg
                ? <span style={{ color: '#6a8a2a' }}>{Math.max(0, stats.current_weight_kg - stats.target_weight_kg).toFixed(1)}<span style={S.statUnit}>кг</span></span>
                : '—'}
            </div>
            {stats?.predicted_goal_date && (
              <div style={{ fontSize: 10, color: '#b0b890', marginTop: 4 }}>
                ~{new Date(stats.predicted_goal_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2a3010' }}>Динамика веса</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {periods.map(p => (
                <button key={p.days} style={S.periodBtn(period === p.days)} onClick={() => setPeriod(p.days)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#b0b890' }} tickLine={false} axisLine={false} />
                <YAxis domain={[minW, maxW]} tick={{ fontSize: 11, fill: '#b0b890' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {profile?.target_weight_kg && (
                  <ReferenceLine y={profile.target_weight_kg} stroke="#6a8a2a" strokeDasharray="4 4" label={{ value: 'Цель', fill: '#6a8a2a', fontSize: 11 }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="#6a8a2a" strokeWidth={2} dot={{ fill: '#6a8a2a', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b890', fontSize: 13 }}>
              Недостаточно данных для графика
            </div>
          )}
        </div>

        {/* Log */}
        <div style={S.card}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2a3010', marginBottom: 12 }}>История взвешиваний</p>
          {logs?.length === 0 && (
            <p style={{ fontSize: 13, color: '#b0b890', textAlign: 'center', padding: '20px 0' }}>Нет записей</p>
          )}
          {logs?.map((l: any) => (
            <div key={l.id} style={S.logRow}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#2a3010' }}>{l.weight_kg} кг</span>
                {l.notes && <span style={{ fontSize: 12, color: '#8a9060', marginLeft: 10 }}>{l.notes}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#b0b890' }}>
                  {new Date(l.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <button style={S.delBtn} onClick={() => deleteLog.mutate(l.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
