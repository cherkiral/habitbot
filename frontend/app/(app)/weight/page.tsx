'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts'

const c = {
  bg: '#faf8f0', card: '#ffffff', dark: '#3a4a1a', accent: '#6a8a2a',
  border: '#ddd8c0', muted: '#8a9060', hint: '#b0b890', primary: '#2a3010',
  amber: '#d97706', green: '#16a34a', red: '#dc2626', blue: '#2563eb',
}

const card = (e?: React.CSSProperties): React.CSSProperties => ({
  background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, ...e,
})

const PERIODS = [{ label: '7 дней', days: 7 }, { label: '30 дней', days: 30 }, { label: '3 мес', days: 90 }, { label: 'Всё', days: 365 }]

const BMI_COLOR: Record<string, string> = {
  blue: '#3b82f6', green: '#16a34a', yellow: '#d97706', orange: '#ea580c', red: '#dc2626', darkred: '#9f1239',
}

const REC_LEVEL: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  danger:  { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
}

const WTip = ({ active, payload, label: l }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: c.hint, marginBottom: 3 }}>{l}</p>
      <p style={{ color: c.primary, fontWeight: 600 }}>{payload[0]?.value} кг</p>
      {payload[1]?.value && <p style={{ color: c.accent, fontSize: 10 }}>SMA7: {payload[1].value}</p>}
      {payload[2]?.value && <p style={{ color: c.blue, fontSize: 10 }}>SMA14: {payload[2].value}</p>}
    </div>
  )
}

export default function WeightPage() {
  const qc = useQueryClient()
  const [period, setPeriod] = useState(30)
  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [tab, setTab] = useState<'chart' | 'milestones' | 'analytics'>('chart')

  const { data: stats } = useQuery({ queryKey: ['weight-stats'], queryFn: () => api.get('/weight/stats').then(r => r.data) })
  const { data: bmi } = useQuery({ queryKey: ['weight-bmi'], queryFn: () => api.get('/weight/bmi').then(r => r.data) })
  const { data: forecast } = useQuery({ queryKey: ['weight-forecast'], queryFn: () => api.get('/weight/forecast').then(r => r.data).catch(() => null) })
  const { data: chart } = useQuery({ queryKey: ['weight-chart', period], queryFn: () => api.get('/weight/chart', { params: { period } }).then(r => r.data) })
  const { data: milestones } = useQuery({ queryKey: ['weight-milestones'], queryFn: () => api.get('/weight/milestones').then(r => r.data) })
  const { data: recs } = useQuery({ queryKey: ['weight-recs'], queryFn: () => api.get('/weight/recommendations').then(r => r.data) })
  const { data: weekly } = useQuery({ queryKey: ['weight-weekly'], queryFn: () => api.get('/weight/weekly-summary').then(r => r.data) })
  const { data: logs } = useQuery({ queryKey: ['weight-logs', period], queryFn: () => api.get('/weight/logs', { params: { limit: 50 } }).then(r => r.data) })

  const add = useMutation({
    mutationFn: () => api.post('/weight/logs', { weight_kg: parseFloat(weight), notes: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight'] })
      setWeight(''); setNote(''); setShowForm(false)
    },
  })
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/weight/logs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight'] }),
  })

  const chartPoints = chart?.points || []
  const bmiColor = bmi?.category?.color ? BMI_COLOR[bmi.category.color] || c.accent : c.accent
  const bmiPct = bmi?.bmi ? Math.min((bmi.bmi / 40) * 100, 100) : 0

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, color: c.primary, outline: 'none', fontFamily: "'DM Sans',sans-serif", background: c.bg }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header title="Вес" action={{ label: 'Взвеситься', onClick: () => setShowForm(v => !v) }} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: c.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Форма */}
          {showForm && (
            <div style={card()}>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.primary, marginBottom: 14 }}>Новое взвешивание</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: c.muted, marginBottom: 5 }}>Вес (кг)</p>
                  <input type="number" step="0.1" placeholder="89.5" value={weight}
                    onChange={e => setWeight(e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: c.muted, marginBottom: 5 }}>Заметка</p>
                  <input type="text" placeholder="Утреннее взвешивание" value={note}
                    onChange={e => setNote(e.target.value)} style={inp} />
                </div>
              </div>
              <button onClick={() => weight && add.mutate()} disabled={!weight || add.isPending}
                style={{ marginTop: 14, padding: '10px 24px', background: c.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {add.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          )}

          {/* Главный Bento ряд */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr', gap: 12 }}>

            {/* Текущий вес — тёмный блок */}
            <div style={{ ...card({ background: c.dark, border: `1px solid ${c.dark}`, gridRow: 'span 2', display: 'flex', flexDirection: 'column' }) }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Текущий вес</p>
              <div style={{ fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-3px', lineHeight: 1 }}>
                {stats?.current_weight_kg?.toFixed(1) ?? '—'}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>кг</p>

              {stats?.delta_week_kg != null && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>ЗА НЕДЕЛЮ</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: stats.delta_week_kg < 0 ? '#86efac' : '#fca5a5' }}>
                    {stats.delta_week_kg > 0 ? '+' : ''}{stats.delta_week_kg} кг
                  </p>
                </div>
              )}

              {stats?.kg_per_week != null && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>ТЕМП</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: stats.kg_per_week < 0 ? '#86efac' : '#fca5a5' }}>
                    {stats.kg_per_week > 0 ? '+' : ''}{stats.kg_per_week} кг/нед
                  </p>
                </div>
              )}

              <div style={{ flex: 1 }} />

              {stats?.goal_progress_pct != null && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>ПРОГРЕСС К ЦЕЛИ</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ width: `${stats.goal_progress_pct}%`, height: '100%', background: c.amber, borderRadius: 99 }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{stats.goal_progress_pct}%</p>
                </div>
              )}
            </div>

            {/* ИМТ */}
            <div style={card()}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 8 }}>ИМТ</p>
              {bmi ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 600, color: bmiColor, letterSpacing: '-1px', lineHeight: 1 }}>
                    {bmi.bmi}
                  </div>
                  <p style={{ fontSize: 11, color: bmiColor, marginTop: 5, fontWeight: 500 }}>{bmi.category?.name}</p>
                  {/* Полоска ИМТ */}
                  <div style={{ marginTop: 10, position: 'relative' }}>
                    <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ flex: 18.5, background: '#3b82f6' }} />
                      <div style={{ flex: 6.5, background: '#16a34a' }} />
                      <div style={{ flex: 5, background: '#d97706' }} />
                      <div style={{ flex: 5, background: '#ea580c' }} />
                      <div style={{ flex: 5, background: '#dc2626' }} />
                    </div>
                    <div style={{
                      position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                      background: '#fff', border: `2px solid ${bmiColor}`, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      left: `calc(${Math.min(bmiPct, 96)}% - 5px)`,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: c.hint }}>16</span>
                    <span style={{ fontSize: 9, color: c.hint }}>40+</span>
                  </div>
                  <p style={{ fontSize: 10, color: c.hint, marginTop: 6 }}>Источник: {bmi.category?.source}</p>
                </>
              ) : <p style={{ fontSize: 12, color: c.hint }}>Укажи рост в настройках</p>}
            </div>

            {/* Идеальный вес */}
            <div style={card()}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 8 }}>Идеальный вес</p>
              {bmi?.ideal_weight ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 600, color: c.accent, letterSpacing: '-1px', lineHeight: 1 }}>
                    {bmi.ideal_weight.mean_kg}<span style={{ fontSize: 12, fontWeight: 400, color: c.hint, marginLeft: 3 }}>кг</span>
                  </div>
                  <p style={{ fontSize: 11, color: c.hint, marginTop: 5 }}>
                    Диапазон: {bmi.ideal_weight.min_kg}–{bmi.ideal_weight.max_kg} кг
                  </p>
                  <p style={{ fontSize: 10, color: c.hint, marginTop: 3 }}>
                    До идеала: {bmi.to_ideal_weight_kg > 0 ? `${bmi.to_ideal_weight_kg} кг` : 'Достигнут! 🎉'}
                  </p>
                  <p style={{ fontSize: 9, color: c.hint, marginTop: 6 }}>
                    {bmi.ideal_weight.sources?.join(' · ')}
                  </p>
                </>
              ) : <p style={{ fontSize: 12, color: c.hint }}>Укажи рост и пол в настройках</p>}
            </div>

            {/* Прогноз */}
            <div style={card()}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 8 }}>Прогноз</p>
              {forecast?.possible ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 600, color: c.primary, letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {forecast.realistic?.date
                      ? new Date(forecast.realistic.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
                      : '—'}
                  </div>
                  <p style={{ fontSize: 10, color: c.hint, marginTop: 4 }}>Реалистичный сценарий</p>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {forecast.optimistic?.date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: c.green }}>Оптимистично</span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: c.green }}>
                          {new Date(forecast.optimistic.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                    {forecast.pessimistic?.date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: c.hint }}>Пессимистично</span>
                        <span style={{ fontSize: 10, color: c.hint }}>
                          {new Date(forecast.pessimistic.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 9, color: c.hint, marginTop: 6 }}>{forecast.source}</p>
                </>
              ) : (
                <p style={{ fontSize: 12, color: c.hint }}>
                  {forecast?.reason || 'Нужно больше взвешиваний'}
                </p>
              )}
            </div>

            {/* Неделя — статистика */}
            <div style={{ ...card({ gridColumn: 'span 2' }), display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 10 }}>Эта неделя</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Среднее', v: weekly?.this_week?.avg ? `${weekly.this_week.avg} кг` : '—' },
                    { l: 'Взвешиваний', v: `${weekly?.this_week?.count ?? 0} раз` },
                    { l: 'Мин', v: weekly?.this_week?.min ? `${weekly.this_week.min} кг` : '—' },
                    { l: 'Макс', v: weekly?.this_week?.max ? `${weekly.this_week.max} кг` : '—' },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ padding: '8px 10px', background: c.bg, borderRadius: 8, border: `1px solid ${c.border}` }}>
                      <p style={{ fontSize: 9, color: c.hint, marginBottom: 2 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: c.primary }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 1, background: c.border, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 10 }}>Прошлая неделя</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Среднее', v: weekly?.last_week?.avg ? `${weekly.last_week.avg} кг` : '—' },
                    { l: 'Взвешиваний', v: `${weekly?.last_week?.count ?? 0} раз` },
                    { l: 'Изменение', v: weekly?.delta_vs_last_week != null ? `${weekly.delta_vs_last_week > 0 ? '+' : ''}${weekly.delta_vs_last_week} кг` : '—', color: (weekly?.delta_vs_last_week ?? 0) < 0 ? c.green : c.red },
                    { l: 'Стрик взвеш.', v: `${stats?.weighing_streak ?? 0} дн.` },
                  ].map(({ l, v, color }: any) => (
                    <div key={l} style={{ padding: '8px 10px', background: c.bg, borderRadius: 8, border: `1px solid ${c.border}` }}>
                      <p style={{ fontSize: 9, color: c.hint, marginBottom: 2 }}>{l}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: color || c.primary }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Рекомендации */}
            <div style={{ ...card({ gridColumn: 'span 2' }) }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c.hint, marginBottom: 10 }}>Рекомендации</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(recs || []).map((r: any) => {
                  const style = REC_LEVEL[r.level] || REC_LEVEL.info
                  return (
                    <div key={r.code} style={{ padding: '10px 14px', background: style.bg, border: `1px solid ${style.border}`, borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: style.text }}>{r.title}</p>
                        {r.source && <span style={{ fontSize: 9, color: style.text, opacity: 0.7, marginLeft: 'auto' }}>{r.source}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: style.text, opacity: 0.85 }}>{r.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Вкладки */}
          <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${c.border}`, paddingBottom: 0 }}>
            {(['chart', 'milestones', 'analytics'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 16px', fontSize: 12, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? c.accent : c.muted,
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t ? c.accent : 'transparent'}`,
                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                marginBottom: -1,
              }}>
                {{ chart: '📈 График', milestones: '🏁 Вехи', analytics: '📊 История' }[t]}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
              {tab === 'chart' && PERIODS.map(p => (
                <button key={p.days} onClick={() => setPeriod(p.days)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: period === p.days ? 600 : 400,
                  border: `1px solid ${period === p.days ? c.accent : c.border}`,
                  background: period === p.days ? '#eef4d8' : 'transparent',
                  color: period === p.days ? c.dark : c.hint, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                }}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* График */}
          {tab === 'chart' && (
            <div style={card()}>
              {chartPoints.length > 1 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.hint }} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: c.hint }} tickLine={false} axisLine={false} />
                    <Tooltip content={<WTip />} />
                    {chart?.target_weight_kg && (
                      <ReferenceLine y={chart.target_weight_kg} stroke={c.accent} strokeDasharray="5 5"
                        label={{ value: `Цель: ${chart.target_weight_kg}`, fill: c.accent, fontSize: 10, position: 'right' }} />
                    )}
                    <Line type="monotone" dataKey="weight" stroke={c.primary} strokeWidth={2} dot={{ fill: c.primary, r: 2 }} activeDot={{ r: 4 }} name="Вес" />
                    <Line type="monotone" dataKey="sma7" stroke={c.accent} strokeWidth={1.5} dot={false} name="SMA 7" strokeDasharray="3 2" />
                    <Line type="monotone" dataKey="sma14" stroke={c.blue} strokeWidth={1.5} dot={false} name="SMA 14" strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.hint, fontSize: 13 }}>
                  Добавь первое взвешивание
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[
                  { color: c.primary, label: 'Вес' },
                  { color: c.accent, label: 'SMA 7 (среднее за 7 дней)' },
                  { color: c.blue, label: 'SMA 14 (среднее за 14 дней)' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 2, background: color, borderRadius: 99 }} />
                    <span style={{ fontSize: 10, color: c.hint }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Вехи */}
          {tab === 'milestones' && (
            <div style={card()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(milestones || []).length === 0 && <p style={{ fontSize: 13, color: c.hint, textAlign: 'center', padding: 20 }}>Нет данных</p>}
                {(milestones || []).map((m: any) => (
                  <div key={m.code} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: m.achieved ? '#eef4d8' : c.bg,
                    border: `1px solid ${m.achieved ? '#c8e090' : c.border}`, borderRadius: 10,
                    opacity: m.achieved ? 1 : 0.75,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: m.achieved ? c.accent : '#e8e4d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {m.achieved ? '✓' : '○'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: m.achieved ? c.dark : c.primary }}>{m.label}</p>
                      <p style={{ fontSize: 11, color: c.muted }}>{m.description}</p>
                      {m.source && <p style={{ fontSize: 9, color: c.hint, marginTop: 1 }}>{m.source}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: m.achieved ? c.accent : c.hint }}>
                        {m.target_weight} кг
                      </p>
                      {m.achieved && m.achieved_date && (
                        <p style={{ fontSize: 10, color: c.accent }}>
                          {new Date(m.achieved_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </p>
                      )}
                      {!m.achieved && m.forecast_date && (
                        <p style={{ fontSize: 10, color: c.hint }}>
                          ~{new Date(m.forecast_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* История */}
          {tab === 'analytics' && (
            <div style={card()}>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.primary, marginBottom: 14 }}>История взвешиваний</p>
              {!logs?.length && <p style={{ fontSize: 13, color: c.hint, textAlign: 'center', padding: 20 }}>Нет записей</p>}
              {logs?.map((l: any, i: number) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < logs.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#eef4d8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.accent }}>{l.weight_kg}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.primary }}>{l.weight_kg} кг</p>
                    {l.notes && <p style={{ fontSize: 11, color: c.muted }}>{l.notes}</p>}
                  </div>
                  <p style={{ fontSize: 11, color: c.hint }}>
                    {new Date(l.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button onClick={() => del.mutate(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e88', fontSize: 13, padding: '4px 8px' }}>✕</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
