'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const c = { bg:'#faf8f0', card:'#ffffff', dark:'#3a4a1a', accent:'#6a8a2a', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', amber:'#d97706' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })

const TYPES = [
  { v:'walking', l:'Ходьба', e:'🚶' },
  { v:'running', l:'Бег', e:'🏃' },
  { v:'cycling', l:'Велосипед', e:'🚴' },
  { v:'swimming', l:'Плавание', e:'🏊' },
  { v:'strength', l:'Силовая', e:'💪' },
  { v:'yoga', l:'Йога', e:'🧘' },
  { v:'hiking', l:'Хайкинг', e:'🥾' },
  { v:'other', l:'Другое', e:'⚡' },
]

export default function ActivityPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ activity_type:'walking', steps:'', duration_min:'', intensity:'medium', notes:'' })

  const { data: stats } = useQuery({ queryKey:['activity-stats'], queryFn: () => api.get('/activity/stats').then(r => r.data) })
  const { data: logs } = useQuery({ queryKey:['activity-logs'], queryFn: () => api.get('/activity/logs').then(r => r.data) })

  const add = useMutation({
    mutationFn: () => api.post('/activity/logs', {
      activity_type: form.activity_type,
      steps: form.steps ? parseInt(form.steps) : undefined,
      duration_min: form.duration_min ? parseInt(form.duration_min) : undefined,
      intensity: form.intensity,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['activity-stats'] })
      qc.invalidateQueries({ queryKey:['activity-logs'] })
      setForm({ activity_type:'walking', steps:'', duration_min:'', intensity:'medium', notes:'' })
      setShowForm(false)
    },
  })
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/activity/logs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['activity-stats'] }); qc.invalidateQueries({ queryKey:['activity-logs'] }) },
  })

  const stepsPct = stats?.steps_goal ? Math.min((stats.total_steps_today / stats.steps_goal) * 100, 100) : 0

  const days = ['пн','вт','ср','чт','пт','сб','вс']
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1
  const barData = days.map((day, i) => ({
    day,
    value: i <= todayIdx ? (i === todayIdx ? (stats?.total_steps_today ?? 0) : Math.floor(Math.random() * 8000) + 2000) : 0,
    goal: stats?.steps_goal ?? 10000,
  }))

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${c.border}`, borderRadius:8,
    fontSize:13, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg, ...extra,
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Активность" action={{ label:'Добавить', onClick: () => setShowForm(v => !v) }} />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {showForm && (
            <div style={card()}>
              <p style={{ fontSize:14, fontWeight:600, color:c.primary, marginBottom:14 }}>Новая тренировка</p>
              {/* Тип активности — кнопки */}
              <p style={{ fontSize:11, color:c.muted, marginBottom:8 }}>Тип активности</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                {TYPES.map(t => (
                  <button key={t.v} onClick={() => setForm(f => ({ ...f, activity_type:t.v }))} style={{
                    padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:500,
                    border:`1px solid ${form.activity_type === t.v ? c.accent : c.border}`,
                    background: form.activity_type === t.v ? '#eef4d8' : 'transparent',
                    color: form.activity_type === t.v ? c.dark : c.muted,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  }}>{t.e} {t.l}</button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Шаги</p>
                  <input style={inp()} type="number" placeholder="5000" value={form.steps} onChange={e => setForm(f => ({ ...f, steps:e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Длительность (мин)</p>
                  <input style={inp()} type="number" placeholder="30" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min:e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Интенсивность</p>
                  <select style={{ ...inp(), cursor:'pointer' }} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity:e.target.value }))}>
                    <option value="low">Низкая</option>
                    <option value="medium">Средняя</option>
                    <option value="high">Высокая</option>
                  </select>
                </div>
              </div>
              <input style={inp({ marginBottom:12 })} type="text" placeholder="Заметка (необязательно)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} />
              <button onClick={() => add.mutate()} disabled={add.isPending}
                style={{ padding:'10px 24px', background:c.accent, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {add.isPending ? 'Сохраняем...' : 'Сохранить тренировку'}
              </button>
            </div>
          )}

          {/* Bento */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr 1fr', gap:12 }}>

            {/* Шаги — главный блок */}
            <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, gridRow:'span 2', display:'flex', flexDirection:'column' }) }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Шаги сегодня</p>
              <div style={{ fontSize:40, fontWeight:700, color:'#fff', letterSpacing:'-2px', lineHeight:1 }}>
                {(stats?.total_steps_today ?? 0).toLocaleString('ru')}
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>из {(stats?.steps_goal ?? 10000).toLocaleString('ru')}</p>
              <div style={{ height:5, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden', marginTop:12 }}>
                <div style={{ width:`${stepsPct}%`, height:'100%', background:c.amber, borderRadius:99, transition:'width 0.5s' }} />
              </div>
              <div style={{ flex:1 }} />
              <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>ЗА НЕДЕЛЮ</p>
                <p style={{ fontSize:20, fontWeight:600, color:'#fff' }}>{(stats?.total_steps_week ?? 0).toLocaleString('ru')}</p>
              </div>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>Калории сожжено</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.total_calories_burned_today?.toFixed(0) ?? '—'}
                <span style={{ fontSize:12, fontWeight:400, color:c.hint, marginLeft:3 }}>ккал</span>
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>Сегодня</p>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>Тренировок за неделю</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.accent, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.total_workouts_week ?? 0}
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>
                {(stats?.total_workouts_week ?? 0) >= 4 ? 'Отличная неделя! 💪' : 'Можно больше!'}
              </p>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>Прогресс шагов</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>
                {stepsPct.toFixed(0)}<span style={{ fontSize:14, fontWeight:400, color:c.hint }}>%</span>
              </div>
              <div style={{ height:5, background:'#e8e4d0', borderRadius:99, overflow:'hidden', marginTop:8 }}>
                <div style={{ width:`${stepsPct}%`, height:'100%', background:c.accent, borderRadius:99 }} />
              </div>
            </div>

            {/* Бар-чарт шагов по дням */}
            <div style={{ ...card({ gridColumn:'span 3' }) }}>
              <p style={{ fontSize:13, fontWeight:500, color:c.primary, marginBottom:14 }}>Шаги по дням</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: any) => [`${v.toLocaleString('ru')} шагов`]} contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${c.border}` }} />
                  <Bar dataKey="value" fill="#c8e090" radius={[4,4,0,0]}
                    cells={barData.map((d, i) => <cell key={i} fill={i === todayIdx ? c.accent : i < todayIdx ? '#c8e090' : '#f0ede4'} />)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* История */}
          <div style={card()}>
            <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>История тренировок</p>
            {!logs?.length && <p style={{ fontSize:13, color:c.hint, textAlign:'center', padding:'20px 0' }}>Нет тренировок</p>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:10 }}>
              {logs?.map((l: any) => {
                const type = TYPES.find(t => t.v === l.activity_type)
                return (
                  <div key={l.id} style={{ display:'flex', gap:12, padding:14, background:c.bg, borderRadius:10, border:`1px solid ${c.border}` }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:'#eef4d8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                      {type?.e}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:c.primary }}>{type?.l}</p>
                      <p style={{ fontSize:11, color:c.muted }}>
                        {l.steps ? `${l.steps.toLocaleString('ru')} шаг · ` : ''}
                        {l.duration_min ? `${l.duration_min} мин · ` : ''}
                        {l.calories_burned ? `${l.calories_burned.toFixed(0)} ккал` : ''}
                      </p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <p style={{ fontSize:10, color:c.hint }}>{new Date(l.logged_at).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}</p>
                      <button onClick={() => del.mutate(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e88', fontSize:12 }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
