'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const c = {
  bg:'#faf8f0', card:'#ffffff', dark:'#3a4a1a', accent:'#6a8a2a',
  border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010',
  amber:'#d97706', green:'#16a34a', red:'#dc2626',
}
const card = (e?: React.CSSProperties): React.CSSProperties => ({
  background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, ...e,
})

const PERIODS = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '3 мес', days: 90 },
  { label: 'Всё', days: 365 },
]

const WTip = ({ active, payload, label: l }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${c.border}`, borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <p style={{ color:c.hint, marginBottom:2 }}>{l}</p>
      <p style={{ color:c.primary, fontWeight:600 }}>{payload[0].value} кг</p>
    </div>
  )
}

export default function WeightPage() {
  const qc = useQueryClient()
  const [period, setPeriod] = useState(30)
  const [showForm, setShowForm] = useState(false)
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const { data: stats } = useQuery({ queryKey: ['weight-stats'], queryFn: () => api.get('/weight/stats').then(r => r.data) })
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => api.get('/users/me/profile').then(r => r.data) })
  const { data: logs } = useQuery({
    queryKey: ['weight-logs', period],
    queryFn: () => {
      const from = new Date(); from.setDate(from.getDate() - period)
      return api.get('/weight/logs', { params: { from_date: from.toISOString(), limit: 100 } }).then(r => r.data)
    },
  })

  const add = useMutation({
    mutationFn: () => api.post('/weight/logs', { weight_kg: parseFloat(weight), notes: note || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['weight-logs'] }); qc.invalidateQueries({ queryKey: ['weight-stats'] }); setWeight(''); setNote(''); setShowForm(false) },
  })
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/weight/logs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['weight-logs'] }); qc.invalidateQueries({ queryKey: ['weight-stats'] }) },
  })

  const chartData = [...(logs || [])].reverse().map((l: any) => ({
    date: new Date(l.logged_at).toLocaleDateString('ru-RU', { day:'numeric', month:'short' }),
    weight: l.weight_kg,
  }))
  const toGoal = stats?.current_weight_kg && stats?.target_weight_kg
    ? Math.max(0, stats.current_weight_kg - stats.target_weight_kg).toFixed(1) : null

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Вес" action={{ label:'Взвеситься', onClick: () => setShowForm(v => !v) }} />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background: c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Form */}
          {showForm && (
            <div style={card()}>
              <p style={{ fontSize:14, fontWeight:600, color:c.primary, marginBottom:14 }}>Новое взвешивание</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Вес (кг)</p>
                  <input type="number" step="0.1" placeholder="89.5" value={weight}
                    onChange={e => setWeight(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', border:`1px solid ${c.border}`, borderRadius:8, fontSize:15, fontWeight:600, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg }} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Заметка</p>
                  <input type="text" placeholder="Утреннее взвешивание" value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', border:`1px solid ${c.border}`, borderRadius:8, fontSize:13, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg }} />
                </div>
              </div>
              <button onClick={() => weight && add.mutate()} disabled={!weight || add.isPending}
                style={{ marginTop:14, padding:'10px 24px', background:c.accent, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {add.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          )}

          {/* Top bento */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr 1fr', gap:12 }}>

            {/* Главный блок — текущий вес */}
            <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, gridRow:'span 2', display:'flex', flexDirection:'column' }) }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Текущий вес</p>
              <div style={{ fontSize:48, fontWeight:700, color:'#fff', letterSpacing:'-3px', lineHeight:1 }}>
                {stats?.current_weight_kg?.toFixed(1) ?? '—'}
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>кг</p>
              {stats?.delta_week_kg != null && (
                <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>ЗА НЕДЕЛЮ</p>
                  <p style={{ fontSize:18, fontWeight:600, color: stats.delta_week_kg < 0 ? '#86efac' : '#fca5a5' }}>
                    {stats.delta_week_kg > 0 ? '+' : ''}{stats.delta_week_kg} кг
                  </p>
                </div>
              )}
              <div style={{ flex:1 }} />
              {toGoal && (
                <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>ДО ЦЕЛИ</p>
                  <p style={{ fontSize:20, fontWeight:600, color:'#fff' }}>{toGoal} кг</p>
                  {stats?.predicted_goal_date && (
                    <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:3 }}>
                      ~{new Date(stats.predicted_goal_date).toLocaleDateString('ru-RU', { day:'numeric', month:'long' })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Цель */}
            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>Цель</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.accent, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.target_weight_kg?.toFixed(1) ?? '—'}<span style={{ fontSize:13, fontWeight:400, color:c.hint, marginLeft:3 }}>кг</span>
              </div>
              {stats?.current_weight_kg && stats?.target_weight_kg && (
                <>
                  <div style={{ height:5, background:'#e8e4d0', borderRadius:99, overflow:'hidden', marginTop:12 }}>
                    <div style={{ width:`${Math.min(Math.max((1 - (stats.current_weight_kg - stats.target_weight_kg) / ((stats.start_weight_kg || stats.current_weight_kg + 10) - stats.target_weight_kg)) * 100, 0), 100)}%`, height:'100%', background:c.accent, borderRadius:99 }} />
                  </div>
                  <p style={{ fontSize:10, color:c.hint, marginTop:5 }}>Осталось {toGoal} кг</p>
                </>
              )}
            </div>

            {/* За месяц */}
            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>За месяц</p>
              <div style={{ fontSize:28, fontWeight:600, letterSpacing:'-1px', lineHeight:1, color: (stats?.delta_month_kg ?? 0) < 0 ? c.green : c.red }}>
                {stats?.delta_month_kg != null ? `${stats.delta_month_kg > 0 ? '+' : ''}${stats.delta_month_kg}` : '—'}
                <span style={{ fontSize:13, fontWeight:400, color:c.hint, marginLeft:3 }}>кг</span>
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>
                {(stats?.delta_month_kg ?? 0) < 0 ? 'Отличный результат!' : 'Продолжай работать'}
              </p>
            </div>

            {/* Всего потеряно */}
            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>Всего потеряно</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.accent, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.delta_total_kg != null ? Math.abs(stats.delta_total_kg).toFixed(1) : '—'}
                <span style={{ fontSize:13, fontWeight:400, color:c.hint, marginLeft:3 }}>кг</span>
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>С начала трекинга</p>
            </div>

            {/* График */}
            <div style={{ ...card({ gridColumn:'span 3' }) }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <span style={{ fontSize:13, fontWeight:500, color:c.primary }}>Динамика</span>
                <div style={{ display:'flex', gap:5 }}>
                  {PERIODS.map(p => (
                    <button key={p.days} onClick={() => setPeriod(p.days)} style={{
                      padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight: period === p.days ? 600 : 400,
                      border: `1px solid ${period === p.days ? c.accent : c.border}`,
                      background: period === p.days ? '#eef4d8' : 'transparent',
                      color: period === p.days ? c.dark : c.hint, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto','auto']} tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                    <Tooltip content={<WTip />} />
                    {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke={c.accent} strokeDasharray="4 4" />}
                    <Line type="monotone" dataKey="weight" stroke={c.accent} strokeWidth={2.5} dot={false} activeDot={{ r:4, fill:c.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:c.hint, fontSize:13 }}>
                  Добавь первое взвешивание
                </div>
              )}
            </div>

          </div>

          {/* История */}
          <div style={card()}>
            <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>История взвешиваний</p>
            {!logs?.length && <p style={{ fontSize:13, color:c.hint, textAlign:'center', padding:'20px 0' }}>Нет записей за выбранный период</p>}
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {logs?.map((l: any, i: number) => (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'10px 0', borderBottom: i < logs.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                  <div style={{ width:48, height:48, borderRadius:10, background:'#eef4d8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:16, fontWeight:700, color:c.accent }}>{l.weight_kg}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:c.primary }}>{l.weight_kg} кг</p>
                    {l.notes && <p style={{ fontSize:11, color:c.muted }}>{l.notes}</p>}
                  </div>
                  <p style={{ fontSize:11, color:c.hint }}>
                    {new Date(l.logged_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <button onClick={() => del.mutate(l.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#e88', fontSize:13, padding:'4px 8px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
