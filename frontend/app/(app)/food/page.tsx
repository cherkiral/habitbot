'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const c = { bg:'#faf8f0', card:'#ffffff', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', accent:'#6a8a2a', dark:'#3a4a1a', amber:'#d97706' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })
const inp = (e?: React.CSSProperties): React.CSSProperties => ({ width:'100%', padding:'9px 12px', border:`1px solid ${c.border}`, borderRadius:8, fontSize:13, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg, ...e })

const MEALS = [
  { value:'breakfast', label:'Завтрак', emoji:'🌅' },
  { value:'lunch', label:'Обед', emoji:'☀️' },
  { value:'dinner', label:'Ужин', emoji:'🌙' },
  { value:'snack', label:'Перекус', emoji:'🍎' },
]

export default function FoodPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [qty, setQty] = useState('100')
  const [mealType, setMealType] = useState('breakfast')
  const [showForm, setShowForm] = useState(false)

  const { data: summary } = useQuery({ queryKey:['food-summary'], queryFn: () => api.get('/food/logs/summary').then(r => r.data) })
  const { data: logs } = useQuery({ queryKey:['food-logs'], queryFn: () => api.get('/food/logs').then(r => r.data) })
  const { data: profile } = useQuery({ queryKey:['profile'], queryFn: () => api.get('/users/me/profile').then(r => r.data) })

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await api.get('/food/search', { params: { q: search } })
      setSearchResults(res.data)
    } finally { setSearching(false) }
  }

  const addLog = useMutation({
    mutationFn: () => api.post('/food/logs', {
      food_item_id: selected.id,
      food_name: selected.name_ru,
      meal_type: mealType,
      quantity_g: parseFloat(qty),
      calories_per_100g: selected.calories_per_100g,
      protein_per_100g: selected.protein_per_100g,
      fat_per_100g: selected.fat_per_100g,
      carbs_per_100g: selected.carbs_per_100g,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['food-summary'] })
      qc.invalidateQueries({ queryKey:['food-logs'] })
      setSelected(null); setSearch(''); setSearchResults([]); setQty('100'); setShowForm(false)
    },
  })

  const delLog = useMutation({
    mutationFn: (id: string) => api.delete(`/food/logs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['food-summary'] }); qc.invalidateQueries({ queryKey:['food-logs'] }) },
  })

  const calPct = summary?.calories_goal ? Math.min((summary.total_calories / summary.calories_goal) * 100, 100) : 0

  const logsByMeal = MEALS.reduce((acc, m) => {
    acc[m.value] = (logs || []).filter((l: any) => l.meal_type === m.value)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Питание" action={{ label:'Добавить', onClick: () => setShowForm(v => !v) }} />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Форма поиска */}
          {showForm && (
            <div style={card()}>
              <p style={{ fontSize:14, fontWeight:600, color:c.primary, marginBottom:14 }}>Добавить приём пищи</p>

              {/* Тип приёма */}
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                {MEALS.map(m => (
                  <button key={m.value} onClick={() => setMealType(m.value)} style={{
                    flex:1, padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:500,
                    border:`1px solid ${mealType === m.value ? c.accent : c.border}`,
                    background: mealType === m.value ? '#eef4d8' : 'transparent',
                    color: mealType === m.value ? c.dark : c.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                  }}>{m.emoji} {m.label}</button>
                ))}
              </div>

              {/* Поиск */}
              {!selected ? (
                <>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <input style={inp({ flex:1 })} placeholder="Поиск продукта..." value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    <button onClick={handleSearch} disabled={searching} style={{
                      padding:'9px 18px', background:c.accent, color:'#fff', border:'none', borderRadius:8,
                      fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
                    }}>{searching ? '...' : 'Найти'}</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:240, overflowY:'auto' }}>
                      {searchResults.map((item: any) => (
                        <button key={item.id} onClick={() => setSelected(item)} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'10px 12px', border:`1px solid ${c.border}`, borderRadius:8,
                          background:c.bg, cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif",
                        }}>
                          <span style={{ fontSize:13, color:c.primary, fontWeight:500 }}>{item.name_ru}</span>
                          <span style={{ fontSize:11, color:c.hint }}>{item.calories_per_100g} ккал / 100г</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#eef4d8', borderRadius:10, marginBottom:12 }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:c.dark }}>{selected.name_ru}</p>
                      <p style={{ fontSize:11, color:c.muted }}>
                        {selected.calories_per_100g} ккал · Б {selected.protein_per_100g}г · Ж {selected.fat_per_100g}г · У {selected.carbs_per_100g}г (на 100г)
                      </p>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:c.hint, fontSize:16 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>Количество (г)</p>
                      <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inp()} />
                    </div>
                    <div style={{ padding:'9px 16px', background:'#f3f0e4', borderRadius:8, fontSize:12, color:c.muted, textAlign:'center' }}>
                      <p style={{ fontSize:16, fontWeight:700, color:c.primary }}>{((selected.calories_per_100g * parseFloat(qty || '0')) / 100).toFixed(0)}</p>
                      <p>ккал</p>
                    </div>
                    <button onClick={() => addLog.mutate()} disabled={!qty || addLog.isPending} style={{
                      padding:'9px 20px', background:c.accent, color:'#fff', border:'none', borderRadius:8,
                      fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                    }}>Добавить</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bento — статистика */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr 1fr', gap:12 }}>

            {/* Калории — главный блок */}
            <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, gridRow:'span 2', display:'flex', flexDirection:'column' }) }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Калории</p>
              <div style={{ fontSize:44, fontWeight:700, color:'#fff', letterSpacing:'-2px', lineHeight:1 }}>
                {summary?.total_calories?.toFixed(0) ?? '0'}
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>из {summary?.calories_goal ?? '—'} ккал</p>
              <div style={{ height:5, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden', marginTop:12 }}>
                <div style={{ width:`${calPct}%`, height:'100%', background:c.amber, borderRadius:99, transition:'width 0.5s' }} />
              </div>
              <div style={{ flex:1 }} />
              <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.07)', borderRadius:8 }}>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>ОСТАЛОСЬ</p>
                <p style={{ fontSize:20, fontWeight:600, color: (summary?.calories_remaining ?? 0) >= 0 ? '#86efac' : '#fca5a5' }}>
                  {summary?.calories_remaining != null ? Math.abs(summary.calories_remaining).toFixed(0) : '—'} ккал
                </p>
                {(summary?.calories_remaining ?? 0) < 0 && <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Превышение нормы</p>}
              </div>
            </div>

            {/* КБЖУ */}
            {[
              { label:'Белки', val: summary?.total_protein_g, goal: profile?.protein_goal_g, color:'#6a8a2a' },
              { label:'Жиры', val: summary?.total_fat_g, goal: profile?.fat_goal_g, color:'#d97706' },
              { label:'Углеводы', val: summary?.total_carbs_g, goal: profile?.carbs_goal_g, color:'#8a9060' },
            ].map(({ label, val, goal, color }) => (
              <div key={label} style={card()}>
                <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>{label}</p>
                <div style={{ fontSize:28, fontWeight:600, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>
                  {val?.toFixed(0) ?? 0}<span style={{ fontSize:12, fontWeight:400, color:c.hint, marginLeft:3 }}>г</span>
                </div>
                <div style={{ height:4, background:'#e8e4d0', borderRadius:99, overflow:'hidden', marginTop:10 }}>
                  <div style={{ width:`${Math.min((val ?? 0) / (goal || 100) * 100, 100)}%`, height:'100%', background:color, borderRadius:99 }} />
                </div>
                <p style={{ fontSize:10, color:c.hint, marginTop:5 }}>из {goal ?? '—'} г</p>
              </div>
            ))}

            {/* Сводка по приёмам */}
            <div style={{ ...card({ gridColumn:'span 3' }) }}>
              <p style={{ fontSize:13, fontWeight:500, color:c.primary, marginBottom:14 }}>По приёмам пищи</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
                {MEALS.map(m => {
                  const mLogs = logsByMeal[m.value]
                  const mCal = mLogs.reduce((s: number, l: any) => s + l.calories, 0)
                  return (
                    <div key={m.value} style={{ padding:12, background:c.bg, borderRadius:10, border:`1px solid ${c.border}` }}>
                      <p style={{ fontSize:13, marginBottom:4 }}>{m.emoji} <span style={{ fontSize:12, fontWeight:600, color:c.primary }}>{m.label}</span></p>
                      <p style={{ fontSize:18, fontWeight:700, color: mCal > 0 ? c.accent : c.hint, letterSpacing:'-0.5px' }}>{mCal.toFixed(0)} <span style={{ fontSize:11, fontWeight:400, color:c.hint }}>ккал</span></p>
                      <p style={{ fontSize:10, color:c.hint, marginTop:2 }}>{mLogs.length} {mLogs.length === 1 ? 'блюдо' : 'блюд'}</p>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Лог по приёмам */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {MEALS.map(m => {
              const mLogs = logsByMeal[m.value]
              return (
                <div key={m.value} style={card()}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:c.primary }}>{m.emoji} {m.label}</p>
                    <span style={{ fontSize:11, color:c.hint }}>{mLogs.reduce((s: number, l: any) => s + l.calories, 0).toFixed(0)} ккал</span>
                  </div>
                  {mLogs.length === 0 && <p style={{ fontSize:12, color:c.hint, textAlign:'center', padding:'12px 0' }}>Нет записей</p>}
                  {mLogs.map((l: any) => (
                    <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${c.border}` }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:c.primary }}>{l.food_name}</p>
                        <p style={{ fontSize:10, color:c.hint }}>{l.quantity_g}г · Б{l.protein_g.toFixed(0)} Ж{l.fat_g.toFixed(0)} У{l.carbs_g.toFixed(0)}</p>
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:c.accent }}>{l.calories.toFixed(0)}</span>
                      <button onClick={() => delLog.mutate(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e88', fontSize:12, padding:'0 4px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
