'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell , Cell} from 'recharts'

const c = { bg:'#faf8f0', card:'#ffffff', dark:'#3a4a1a', accent:'#6a8a2a', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', amber:'#d97706' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })

const TYPES = [
  { v:'walking', l:'РҐРѕРґСЊР±Р°', e:'рџљ¶' },
  { v:'running', l:'Р‘РµРі', e:'рџЏѓ' },
  { v:'cycling', l:'Р’РµР»РѕСЃРёРїРµРґ', e:'рџљґ' },
  { v:'swimming', l:'РџР»Р°РІР°РЅРёРµ', e:'рџЏЉ' },
  { v:'strength', l:'РЎРёР»РѕРІР°СЏ', e:'рџ’Є' },
  { v:'yoga', l:'Р™РѕРіР°', e:'рџ§' },
  { v:'hiking', l:'РҐР°Р№РєРёРЅРі', e:'рџҐѕ' },
  { v:'other', l:'Р”СЂСѓРіРѕРµ', e:'вљЎ' },
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

  const days = ['РїРЅ','РІС‚','СЃСЂ','С‡С‚','РїС‚','СЃР±','РІСЃ']
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
      <Header title="РђРєС‚РёРІРЅРѕСЃС‚СЊ" action={{ label:'Р”РѕР±Р°РІРёС‚СЊ', onClick: () => setShowForm(v => !v) }} />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {showForm && (
            <div style={card()}>
              <p style={{ fontSize:14, fontWeight:600, color:c.primary, marginBottom:14 }}>РќРѕРІР°СЏ С‚СЂРµРЅРёСЂРѕРІРєР°</p>
              {/* РўРёРї Р°РєС‚РёРІРЅРѕСЃС‚Рё вЂ” РєРЅРѕРїРєРё */}
              <p style={{ fontSize:11, color:c.muted, marginBottom:8 }}>РўРёРї Р°РєС‚РёРІРЅРѕСЃС‚Рё</p>
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
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>РЁР°РіРё</p>
                  <input style={inp()} type="number" placeholder="5000" value={form.steps} onChange={e => setForm(f => ({ ...f, steps:e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ (РјРёРЅ)</p>
                  <input style={inp()} type="number" placeholder="30" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min:e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>РРЅС‚РµРЅСЃРёРІРЅРѕСЃС‚СЊ</p>
                  <select style={{ ...inp(), cursor:'pointer' }} value={form.intensity} onChange={e => setForm(f => ({ ...f, intensity:e.target.value }))}>
                    <option value="low">РќРёР·РєР°СЏ</option>
                    <option value="medium">РЎСЂРµРґРЅСЏСЏ</option>
                    <option value="high">Р’С‹СЃРѕРєР°СЏ</option>
                  </select>
                </div>
              </div>
              <input style={inp({ marginBottom:12 })} type="text" placeholder="Р—Р°РјРµС‚РєР° (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} />
              <button onClick={() => add.mutate()} disabled={add.isPending}
                style={{ padding:'10px 24px', background:c.accent, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                {add.isPending ? 'РЎРѕС…СЂР°РЅСЏРµРј...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ'}
              </button>
            </div>
          )}

          {/* Bento */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr 1fr', gap:12 }}>

            {/* РЁР°РіРё вЂ” РіР»Р°РІРЅС‹Р№ Р±Р»РѕРє */}
            <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, gridRow:'span 2', display:'flex', flexDirection:'column' }) }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>РЁР°РіРё СЃРµРіРѕРґРЅСЏ</p>
              <div style={{ fontSize:40, fontWeight:700, color:'#fff', letterSpacing:'-2px', lineHeight:1 }}>
                {(stats?.total_steps_today ?? 0).toLocaleString('ru')}
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>РёР· {(stats?.steps_goal ?? 10000).toLocaleString('ru')}</p>
              <div style={{ height:5, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden', marginTop:12 }}>
                <div style={{ width:`${stepsPct}%`, height:'100%', background:c.amber, borderRadius:99, transition:'width 0.5s' }} />
              </div>
              <div style={{ flex:1 }} />
              <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>Р—Рђ РќР•Р”Р•Р›Р®</p>
                <p style={{ fontSize:20, fontWeight:600, color:'#fff' }}>{(stats?.total_steps_week ?? 0).toLocaleString('ru')}</p>
              </div>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>РљР°Р»РѕСЂРёРё СЃРѕР¶Р¶РµРЅРѕ</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.total_calories_burned_today?.toFixed(0) ?? 'вЂ”'}
                <span style={{ fontSize:12, fontWeight:400, color:c.hint, marginLeft:3 }}>РєРєР°Р»</span>
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>РЎРµРіРѕРґРЅСЏ</p>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>РўСЂРµРЅРёСЂРѕРІРѕРє Р·Р° РЅРµРґРµР»СЋ</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.accent, letterSpacing:'-1px', lineHeight:1 }}>
                {stats?.total_workouts_week ?? 0}
              </div>
              <p style={{ fontSize:10, color:c.hint, marginTop:8 }}>
                {(stats?.total_workouts_week ?? 0) >= 4 ? 'РћС‚Р»РёС‡РЅР°СЏ РЅРµРґРµР»СЏ! рџ’Є' : 'РњРѕР¶РЅРѕ Р±РѕР»СЊС€Рµ!'}
              </p>
            </div>

            <div style={card()}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>РџСЂРѕРіСЂРµСЃСЃ С€Р°РіРѕРІ</p>
              <div style={{ fontSize:28, fontWeight:600, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>
                {stepsPct.toFixed(0)}<span style={{ fontSize:14, fontWeight:400, color:c.hint }}>%</span>
              </div>
              <div style={{ height:5, background:'#e8e4d0', borderRadius:99, overflow:'hidden', marginTop:8 }}>
                <div style={{ width:`${stepsPct}%`, height:'100%', background:c.accent, borderRadius:99 }} />
              </div>
            </div>

            {/* Р‘Р°СЂ-С‡Р°СЂС‚ С€Р°РіРѕРІ РїРѕ РґРЅСЏРј */}
            <div style={{ ...card({ gridColumn:'span 3' }) }}>
              <p style={{ fontSize:13, fontWeight:500, color:c.primary, marginBottom:14 }}>РЁР°РіРё РїРѕ РґРЅСЏРј</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:10, fill:c.hint }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: any) => [`${v.toLocaleString('ru')} С€Р°РіРѕРІ`]} contentStyle={{ fontSize:11, borderRadius:8, border:`1px solid ${c.border}` }} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {barData.map((d: any, i: number) => (
                      <Cell key={i} fill={i === todayIdx ? c.accent : i < todayIdx ? '#c8e090' : '#f0ede4'} />
                    ))}
                  </Bar>)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* РСЃС‚РѕСЂРёСЏ */}
          <div style={card()}>
            <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>РСЃС‚РѕСЂРёСЏ С‚СЂРµРЅРёСЂРѕРІРѕРє</p>
            {!logs?.length && <p style={{ fontSize:13, color:c.hint, textAlign:'center', padding:'20px 0' }}>РќРµС‚ С‚СЂРµРЅРёСЂРѕРІРѕРє</p>}
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
                        {l.steps ? `${l.steps.toLocaleString('ru')} С€Р°Рі В· ` : ''}
                        {l.duration_min ? `${l.duration_min} РјРёРЅ В· ` : ''}
                        {l.calories_burned ? `${l.calories_burned.toFixed(0)} РєРєР°Р»` : ''}
                      </p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <p style={{ fontSize:10, color:c.hint }}>{new Date(l.logged_at).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}</p>
                      <button onClick={() => del.mutate(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e88', fontSize:12 }}>вњ•</button>
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
