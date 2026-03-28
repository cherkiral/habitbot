'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts'

const c = {
  bg: '#faf8f0',
  card: '#ffffff',
  dark: '#3a4a1a',
  accent: '#6a8a2a',
  border: '#ddd8c0',
  muted: '#8a9060',
  hint: '#b0b890',
  primary: '#2a3010',
  amber: '#d97706',
  blue: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
}

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: c.card,
  border: `1px solid ${c.border}`,
  borderRadius: 12,
  padding: 16,
  ...extra,
})

const label = (light?: boolean): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: light ? 'rgba(255,255,255,0.4)' : c.hint,
  marginBottom: 6,
  display: 'block',
})

const bigVal = (light?: boolean): React.CSSProperties => ({
  fontSize: 28,
  fontWeight: 600,
  color: light ? '#fff' : c.primary,
  letterSpacing: '-1px',
  lineHeight: 1,
})

function PBar({ value, max, color, height = 4 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.min(Math.max((value / (max || 1)) * 100, 0), 100)
  return (
    <div style={{ height, background: '#e8e4d0', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  )
}

const WeightTooltip = ({ active, payload, label: lbl }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: c.hint, marginBottom: 2 }}>{lbl}</p>
      <p style={{ color: c.primary, fontWeight: 600 }}>{payload[0].value} кг</p>
    </div>
  )
}

export default function DashboardPage() {
  const qc = useQueryClient()

  const { data: weightStats } = useQuery({ queryKey: ['weight-stats'], queryFn: () => api.get('/weight/stats').then(r => r.data) })
  const { data: activityStats } = useQuery({ queryKey: ['activity-stats'], queryFn: () => api.get('/activity/stats').then(r => r.data) })
  const { data: waterStats } = useQuery({ queryKey: ['water-stats'], queryFn: () => api.get('/water/stats').then(r => r.data) })
  const { data: foodSummary } = useQuery({ queryKey: ['food-summary'], queryFn: () => api.get('/food/logs/summary').then(r => r.data) })
  const { data: streaks } = useQuery({ queryKey: ['streaks'], queryFn: () => api.get('/streaks').then(r => r.data) })
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/me/profile').then(r => r.data) })
  const { data: weightLogs } = useQuery({ queryKey: ['weight-logs-chart'], queryFn: () => api.get('/weight/logs', { params: { limit: 30 } }).then(r => r.data) })
  const { data: achievements } = useQuery({ queryKey: ['achievements'], queryFn: () => api.get('/achievements').then(r => r.data) })

  const addWater = async (ml: number) => {
    await api.post('/water/logs', { amount_ml: ml })
    qc.invalidateQueries({ queryKey: ['water-stats'] })
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
  const toGoal = weightStats?.current_weight_kg && weightStats?.target_weight_kg
    ? Math.max(0, weightStats.current_weight_kg - weightStats.target_weight_kg).toFixed(1) : null

  const chartData = [...(weightLogs || [])].reverse().map((l: any) => ({
    date: new Date(l.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    weight: l.weight_kg,
  }))

  const streak = streaks?.food?.current_streak ?? 0
  const earnedAch = (achievements || []).filter((a: any) => a.earned).slice(0, 3)

  const days = ['пн','вт','ср','чт','пт','сб','вс']
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header title="Дашборд" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: c.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Greeting */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: c.primary, letterSpacing: '-0.5px' }}>{greeting} 👋</h2>
            {toGoal && <p style={{ fontSize: 13, color: c.muted, marginTop: 3 }}>До цели осталось <span style={{ color: c.accent, fontWeight: 500 }}>{toGoal} кг</span> — продолжай!</p>}
          </div>

          {/* Bento row 1: Streak + 3 метрики */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr 1fr', gap: 12 }}>

            {/* Стрик — тёмный высокий блок */}
            <div style={{ ...card({ background: c.dark, border: `1px solid ${c.dark}`, gridRow: 'span 2', display: 'flex', flexDirection: 'column' }) }}>
              <span style={label(true)}>Стрик</span>
              <div style={{ ...bigVal(true), fontSize: 52, letterSpacing: '-3px' }}>{streak}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>дней подряд</div>
              <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < (streak % 7 || (streak > 0 ? 7 : 0)) ? c.amber : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 12, marginTop: 16 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Рекорд</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{streaks?.food?.longest_streak ?? 0} дней</p>
              </div>
            </div>

            {/* Калории */}
            <div style={card()}>
              <span style={label()}>Калории</span>
              <div style={bigVal()}>
                {foodSummary?.total_calories?.toFixed(0) ?? '—'}
                <span style={{ fontSize: 12, color: c.hint, marginLeft: 4, fontWeight: 400 }}>/ {foodSummary?.calories_goal ?? '—'}</span>
              </div>
              <PBar value={foodSummary?.total_calories ?? 0} max={foodSummary?.calories_goal ?? 100} color={c.accent} />
              <p style={{ fontSize: 10, color: c.hint, marginTop: 5 }}>{foodSummary?.calories_remaining ? `Осталось ${foodSummary.calories_remaining.toFixed(0)} ккал` : 'Норма не задана'}</p>
            </div>

            {/* Вес */}
            <div style={card()}>
              <span style={label()}>Вес</span>
              <div style={bigVal()}>
                {weightStats?.current_weight_kg?.toFixed(1) ?? '—'}
                <span style={{ fontSize: 12, color: c.hint, marginLeft: 4, fontWeight: 400 }}>кг</span>
              </div>
              {weightStats?.delta_week_kg != null && (
                <p style={{ fontSize: 11, color: weightStats.delta_week_kg < 0 ? c.green : c.red, marginTop: 6 }}>
                  {weightStats.delta_week_kg > 0 ? '+' : ''}{weightStats.delta_week_kg} кг за неделю
                </p>
              )}
              {toGoal && <p style={{ fontSize: 10, color: c.hint, marginTop: 3 }}>До цели: {toGoal} кг</p>}
            </div>

            {/* КБЖУ */}
            <div style={card()}>
              <span style={label()}>КБЖУ</span>
              {[
                { lbl: 'Белки', val: foodSummary?.total_protein_g, goal: profile?.protein_goal_g, color: c.accent },
                { lbl: 'Жиры', val: foodSummary?.total_fat_g, goal: profile?.fat_goal_g, color: c.amber },
                { lbl: 'Углев.', val: foodSummary?.total_carbs_g, goal: profile?.carbs_goal_g, color: c.muted },
              ].map(({ lbl, val, goal, color }) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: c.hint, width: 38, flexShrink: 0 }}>{lbl}</span>
                  <div style={{ flex: 1, height: 4, background: '#e8e4d0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((val ?? 0) / (goal || 100) * 100, 100)}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10, color: c.hint, fontFamily: 'monospace', width: 52, textAlign: 'right' }}>
                    {val?.toFixed(0) ?? 0}/{goal ?? '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Вода + Шаги в одном блоке */}
            <div style={{ ...card(), gridColumn: 'span 2', display: 'flex', gap: 20 }}>
              <div style={{ flex: 1 }}>
                <span style={label()}>Вода</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: c.blue, letterSpacing: '-0.5px' }}>{waterStats?.total_ml_today ?? 0}</span>
                  <span style={{ fontSize: 11, color: c.hint }}>/ {waterStats?.goal_ml ?? 2500} мл</span>
                </div>
                <PBar value={waterStats?.total_ml_today ?? 0} max={waterStats?.goal_ml ?? 2500} color={c.blue} />
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[150, 250, 500].map(ml => (
                    <button key={ml} onClick={() => addWater(ml)} style={{
                      flex: 1, padding: '5px 0', border: `1px solid ${c.border}`, borderRadius: 6,
                      fontSize: 11, fontWeight: 500, color: c.blue, background: '#eff6ff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>+{ml}</button>
                  ))}
                </div>
              </div>
              <div style={{ width: 1, background: c.border, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={label()}>Шаги</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: c.primary, letterSpacing: '-0.5px' }}>
                    {activityStats?.total_steps_today?.toLocaleString('ru') ?? 0}
                  </span>
                  <span style={{ fontSize: 11, color: c.hint }}>/ {activityStats?.steps_goal?.toLocaleString('ru') ?? '10 000'}</span>
                </div>
                <PBar value={activityStats?.total_steps_today ?? 0} max={activityStats?.steps_goal ?? 10000} color={c.accent} />
                <p style={{ fontSize: 10, color: c.hint, marginTop: 5 }}>
                  {activityStats?.steps_progress_pct ? `${activityStats.steps_progress_pct}% от цели` : 'Нет данных'}
                </p>
              </div>
            </div>

            {/* Достижения */}
            <div style={card()}>
              <span style={label()}>Достижения</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {earnedAch.length === 0 && <p style={{ fontSize: 11, color: c.hint }}>Пока нет</p>}
                {earnedAch.map((a: any) => (
                  <div key={a.code} style={{ padding: '3px 9px', background: '#eef4d8', borderRadius: 20, fontSize: 10, color: '#3a4a1a', fontWeight: 500 }}>
                    {a.name}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: c.hint }}>
                {earnedAch.length} из {achievements?.length ?? 0} получено
              </p>
              <div style={{ height: 4, background: '#e8e4d0', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
                <div style={{ width: `${achievements?.length ? earnedAch.length / achievements.length * 100 : 0}%`, height: '100%', background: c.amber, borderRadius: 99 }} />
              </div>
            </div>

          </div>

          {/* Bento row 2: График веса + Активность недели */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>

            {/* График веса */}
            <div style={card()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: c.primary }}>Динамика веса</span>
              </div>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.hint }} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: c.hint }} tickLine={false} axisLine={false} />
                    <Tooltip content={<WeightTooltip />} />
                    {profile?.target_weight_kg && (
                      <ReferenceLine y={profile.target_weight_kg} stroke={c.accent} strokeDasharray="4 4" />
                    )}
                    <Line type="monotone" dataKey="weight" stroke={c.accent} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: c.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.hint, fontSize: 13 }}>
                  Добавь первое взвешивание
                </div>
              )}
            </div>

            {/* Активность по дням */}
            <div style={card()}>
              <span style={{ fontSize: 13, fontWeight: 500, color: c.primary, display: 'block', marginBottom: 14 }}>Активность недели</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                {days.map((day, i) => {
                  const isToday = i === todayIdx
                  const hasFuture = i > todayIdx
                  const height = hasFuture ? 6 : Math.floor(Math.random() * 60) + 20
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height,
                        background: hasFuture ? '#f0ede4' : isToday ? c.accent : '#c8e090',
                        borderRadius: '4px 4px 0 0',
                        border: hasFuture ? `1px dashed ${c.border}` : 'none',
                        borderBottom: 'none',
                      }} />
                      <span style={{ fontSize: 9, color: isToday ? c.accent : c.hint, fontWeight: isToday ? 600 : 400 }}>{day}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.border}` }}>
                <p style={{ fontSize: 11, color: c.muted }}>
                  {activityStats?.total_workouts_week ?? 0} тренировок · {activityStats?.total_steps_week?.toLocaleString('ru') ?? 0} шагов
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
