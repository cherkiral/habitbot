'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const S = {
  page: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  content: { flex: 1, overflowY: 'auto' as const, padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 20 },
  card: { background: '#fff', border: '1px solid #ddd8c0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(42,48,16,.06)' },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#d97070', fontSize: 12, padding: '2px 8px' },
}

const QUICK = [150, 250, 350, 500]

export default function WaterPage() {
  const qc = useQueryClient()
  const [custom, setCustom] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['water-stats'],
    queryFn: () => api.get('/water/stats').then(r => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['water-logs-today'],
    queryFn: () => api.get('/water/logs').then(r => r.data),
  })

  const add = useMutation({
    mutationFn: (ml: number) => api.post('/water/logs', { amount_ml: ml }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-stats'] })
      qc.invalidateQueries({ queryKey: ['water-logs-today'] })
      setCustom('')
    },
  })

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/water/logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-stats'] })
      qc.invalidateQueries({ queryKey: ['water-logs-today'] })
    },
  })

  const total = stats?.total_ml_today ?? 0
  const goal = stats?.goal_ml ?? 2500
  const pct = Math.min((total / goal) * 100, 100)

  return (
    <div style={S.page}>
      <Header title="Вода" />
      <div style={S.content}>

        {/* Big progress */}
        <div style={{ ...S.card, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#2563eb', letterSpacing: '-2px', lineHeight: 1 }}>
            {total}
            <span style={{ fontSize: 20, fontWeight: 400, color: '#b0b890', marginLeft: 4 }}>мл</span>
          </div>
          <div style={{ fontSize: 13, color: '#8a9060', marginTop: 6, marginBottom: 20 }}>
            из {goal} мл · осталось {Math.max(0, goal - total)} мл
          </div>

          {/* Progress ring */}
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="58" fill="none" stroke="#e8e4d0" strokeWidth="10" />
              <circle cx="70" cy="70" r="58" fill="none" stroke="#2563eb" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#2a3010' }}>{pct.toFixed(0)}%</span>
              <span style={{ fontSize: 11, color: '#b0b890' }}>выполнено</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {QUICK.map(ml => (
              <button key={ml} onClick={() => add.mutate(ml)} style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid #ddd8c0',
                background: '#faf8f0',
                fontSize: 13,
                fontWeight: 500,
                color: '#2563eb',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                +{ml} мл
              </button>
            ))}
          </div>

          {/* Custom */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, maxWidth: 280, margin: '12px auto 0' }}>
            <input
              type="number"
              placeholder="Своя цифра (мл)"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd8c0', borderRadius: 8, fontSize: 13, color: '#2a3010', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: '#faf8f0' }}
            />
            <button onClick={() => custom && add.mutate(parseInt(custom))} style={{
              padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              +
            </button>
          </div>
        </div>

        {/* Log */}
        <div style={S.card}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2a3010', marginBottom: 12 }}>Записи за сегодня</p>
          {!logs?.length && (
            <p style={{ fontSize: 13, color: '#b0b890', textAlign: 'center', padding: '16px 0' }}>Нет записей</p>
          )}
          {logs?.map((l: any) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ede4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>💧</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#2563eb' }}>+{l.amount_ml} мл</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#b0b890' }}>
                  {new Date(l.logged_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button style={S.delBtn} onClick={() => del.mutate(l.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
