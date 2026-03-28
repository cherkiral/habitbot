'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const c = { bg:'#faf8f0', card:'#ffffff', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', accent:'#6a8a2a', dark:'#3a4a1a', amber:'#d97706' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })

export default function ReportsPage() {
  const qc = useQueryClient()
  const { data: reports } = useQuery({ queryKey:['reports'], queryFn: () => api.get('/reports/weekly').then(r => r.data) })

  const generate = useMutation({
    mutationFn: () => api.post('/reports/weekly/generate'),
    onSuccess: () => qc.invalidateQueries({ queryKey:['reports'] }),
  })

  const latest = reports?.[0]

  const StatBlock = ({ label, value, unit, sub }: { label: string; value: any; unit?: string; sub?: string }) => (
    <div style={{ padding:14, background:c.bg, borderRadius:10, border:`1px solid ${c.border}` }}>
      <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:600, color:c.primary, letterSpacing:'-0.5px', lineHeight:1 }}>
        {value ?? '—'}{unit && <span style={{ fontSize:12, fontWeight:400, color:c.hint, marginLeft:3 }}>{unit}</span>}
      </p>
      {sub && <p style={{ fontSize:10, color:c.hint, marginTop:4 }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Отчёты" action={{ label:'Сгенерировать', onClick: () => generate.mutate() }} />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {generate.isPending && (
            <div style={{ padding:14, background:'#eef4d8', border:`1px solid #c8e090`, borderRadius:10, fontSize:13, color:c.dark }}>
              Генерируем отчёт...
            </div>
          )}

          {!reports?.length && !generate.isPending && (
            <div style={{ ...card(), textAlign:'center', padding:48 }}>
              <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
              <p style={{ fontSize:16, fontWeight:600, color:c.primary, marginBottom:8 }}>Отчётов пока нет</p>
              <p style={{ fontSize:13, color:c.muted, marginBottom:20 }}>Нажми «Сгенерировать» чтобы создать первый отчёт за текущую неделю</p>
              <button onClick={() => generate.mutate()} style={{
                padding:'10px 24px', background:c.accent, color:'#fff', border:'none', borderRadius:8,
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>Создать отчёт</button>
            </div>
          )}

          {latest && (
            <>
              {/* Последний отчёт — Bento */}
              <div>
                <p style={{ fontSize:13, color:c.muted, marginBottom:12 }}>
                  Неделя с {new Date(latest.week_start).toLocaleDateString('ru-RU', { day:'numeric', month:'long' })}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr', gap:12 }}>

                  {/* Вес */}
                  <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, display:'flex', flexDirection:'column' }) }}>
                    <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', marginBottom:6 }}>Изменение веса</p>
                    <div style={{ fontSize:40, fontWeight:700, letterSpacing:'-2px', lineHeight:1, color: (latest.weight_delta_kg ?? 0) <= 0 ? '#86efac' : '#fca5a5' }}>
                      {latest.weight_delta_kg != null ? `${latest.weight_delta_kg > 0 ? '+' : ''}${latest.weight_delta_kg}` : '—'}
                    </div>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>кг за неделю</p>
                    <div style={{ flex:1 }} />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
                      <div>
                        <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>НАЧ.</p>
                        <p style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{latest.weight_start_kg ?? '—'} кг</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>КОНЕЦ</p>
                        <p style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{latest.weight_end_kg ?? '—'} кг</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <StatBlock label="Калории (ср.)" value={latest.avg_calories?.toFixed(0)} unit="ккал/день" />
                    <StatBlock label="Белки (ср.)" value={latest.avg_protein_g?.toFixed(0)} unit="г/день" />
                    <StatBlock label="Жиры (ср.)" value={latest.avg_fat_g?.toFixed(0)} unit="г/день" />
                    <StatBlock label="Углеводы (ср.)" value={latest.avg_carbs_g?.toFixed(0)} unit="г/день" />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <StatBlock label="Шаги (ср.)" value={latest.avg_steps?.toFixed(0)} unit="шаг/день" />
                    <StatBlock label="Тренировок" value={latest.total_workouts} unit="раз" />
                    <StatBlock label="Норма воды" value={latest.water_days_hit} unit="дней" sub="из 7" />
                    <StatBlock label="Стрик" value={latest.streak_days} unit="дней" />
                  </div>

                </div>
              </div>

              {/* Остальные отчёты */}
              {reports.length > 1 && (
                <div style={card()}>
                  <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>История отчётов</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {reports.slice(1).map((r: any, i: number) => (
                      <div key={r.id} style={{ display:'flex', alignItems:'center', gap:20, padding:'12px 0', borderBottom: i < reports.length - 2 ? `1px solid ${c.border}` : 'none' }}>
                        <p style={{ fontSize:13, color:c.muted, width:140, flexShrink:0 }}>
                          {new Date(r.week_start).toLocaleDateString('ru-RU', { day:'numeric', month:'long' })}
                        </p>
                        <div style={{ display:'flex', gap:24, flex:1 }}>
                          <div>
                            <p style={{ fontSize:10, color:c.hint }}>Вес</p>
                            <p style={{ fontSize:13, fontWeight:600, color: (r.weight_delta_kg ?? 0) <= 0 ? c.accent : '#dc2626' }}>
                              {r.weight_delta_kg != null ? `${r.weight_delta_kg > 0 ? '+' : ''}${r.weight_delta_kg} кг` : '—'}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize:10, color:c.hint }}>Калории</p>
                            <p style={{ fontSize:13, fontWeight:600, color:c.primary }}>{r.avg_calories?.toFixed(0) ?? '—'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize:10, color:c.hint }}>Тренировок</p>
                            <p style={{ fontSize:13, fontWeight:600, color:c.primary }}>{r.total_workouts ?? '—'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize:10, color:c.hint }}>Стрик</p>
                            <p style={{ fontSize:13, fontWeight:600, color:c.primary }}>{r.streak_days ?? '—'} дн.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
