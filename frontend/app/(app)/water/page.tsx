'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const c = { bg:'#faf8f0', card:'#ffffff', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', blue:'#2563eb' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({
  background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e,
})

const QUICK = [150, 250, 350, 500]

export default function WaterPage() {
  const qc = useQueryClient()
  const [custom, setCustom] = useState('')

  const { data: stats } = useQuery({ queryKey:['water-stats'], queryFn: () => api.get('/water/stats').then(r => r.data) })
  const { data: logs } = useQuery({ queryKey:['water-logs-today'], queryFn: () => api.get('/water/logs').then(r => r.data) })

  const add = useMutation({
    mutationFn: (ml: number) => api.post('/water/logs', { amount_ml: ml }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['water-stats'] }); qc.invalidateQueries({ queryKey:['water-logs-today'] }); setCustom('') },
  })
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/water/logs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['water-stats'] }); qc.invalidateQueries({ queryKey:['water-logs-today'] }) },
  })

  const total = stats?.total_ml_today ?? 0
  const goal = stats?.goal_ml ?? 2500
  const pct = Math.min((total / goal) * 100, 100)
  const circumference = 2 * Math.PI * 70

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Вода" />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Bento */}
          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr 1fr', gap:12 }}>

            {/* Главный блок — кольцо */}
            <div style={{ ...card({ background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', flexDirection:'column', alignItems:'center', padding:28, gridRow:'span 2' }) }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'#93c5fd', marginBottom:16 }}>Вода сегодня</p>
              <div style={{ position:'relative', width:160, height:160 }}>
                <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#dbeafe" strokeWidth="10" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke={c.blue} strokeWidth="10"
                    strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)}
                    strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:32, fontWeight:700, color:c.blue, letterSpacing:'-1px', lineHeight:1 }}>{pct.toFixed(0)}%</span>
                  <span style={{ fontSize:11, color:'#93c5fd' }}>выполнено</span>
                </div>
              </div>
              <div style={{ textAlign:'center', marginTop:16 }}>
                <p style={{ fontSize:28, fontWeight:700, color:c.blue, letterSpacing:'-1px', lineHeight:1 }}>{total} мл</p>
                <p style={{ fontSize:12, color:'#93c5fd', marginTop:4 }}>из {goal} мл · осталось {Math.max(0, goal - total)} мл</p>
              </div>
            </div>

            {/* Быстрые кнопки */}
            <div style={card()}>
              <p style={{ fontSize:12, fontWeight:600, color:c.primary, marginBottom:14 }}>Быстрое добавление</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {QUICK.map(ml => (
                  <button key={ml} onClick={() => add.mutate(ml)} style={{
                    padding:'14px 0', border:`1px solid #bfdbfe`, borderRadius:10,
                    background:'#eff6ff', fontSize:15, fontWeight:600, color:c.blue,
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s',
                  }}>+{ml} мл</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <input type="number" placeholder="Своя цифра (мл)" value={custom} onChange={e => setCustom(e.target.value)}
                  style={{ flex:1, padding:'9px 12px', border:`1px solid ${c.border}`, borderRadius:8, fontSize:13, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg }} />
                <button onClick={() => custom && add.mutate(parseInt(custom))} style={{
                  padding:'9px 16px', background:c.blue, color:'#fff', border:'none', borderRadius:8,
                  fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                }}>+</button>
              </div>
            </div>

            {/* Статистика */}
            <div style={card()}>
              <p style={{ fontSize:12, fontWeight:600, color:c.primary, marginBottom:14 }}>Статистика</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { label:'Выпито сегодня', value:`${total} мл`, color:c.blue },
                  { label:'Осталось', value:`${Math.max(0, goal - total)} мл`, color:c.muted },
                  { label:'Цель', value:`${goal} мл`, color:'#6a8a2a' },
                  { label:'Порций сегодня', value:`${logs?.length ?? 0}`, color:c.primary },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:c.hint }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* История */}
            <div style={{ ...card({ gridColumn:'span 2' }) }}>
              <p style={{ fontSize:12, fontWeight:600, color:c.primary, marginBottom:12 }}>История за сегодня</p>
              {!logs?.length && <p style={{ fontSize:13, color:c.hint, textAlign:'center', padding:'16px 0' }}>Нет записей</p>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {logs?.map((l: any) => (
                  <div key={l.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#eff6ff', borderRadius:10, border:'1px solid #bfdbfe' }}>
                    <span style={{ fontSize:16 }}>💧</span>
                    <span style={{ fontSize:13, fontWeight:600, color:c.blue }}>+{l.amount_ml} мл</span>
                    <span style={{ fontSize:11, color:'#93c5fd' }}>{new Date(l.logged_at).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' })}</span>
                    <button onClick={() => del.mutate(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', fontSize:12, padding:'0 2px' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
