'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'

const c = { bg:'#faf8f0', card:'#ffffff', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', accent:'#6a8a2a', dark:'#3a4a1a', amber:'#d97706' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })

const ICONS: Record<string, string> = {
  star:'⭐', fire:'🔥', crown:'👑', droplet:'💧', droplets:'💧',
  zap:'⚡', award:'🏆', scale:'⚖️', 'trending-down':'📉', footprints:'🚶',
}

export default function AchievementsPage() {
  const { data: achievements } = useQuery({ queryKey:['achievements'], queryFn: () => api.get('/achievements').then(r => r.data) })
  const { data: streaks } = useQuery({ queryKey:['streaks'], queryFn: () => api.get('/streaks').then(r => r.data) })

  const earned = (achievements || []).filter((a: any) => a.earned)
  const notEarned = (achievements || []).filter((a: any) => !a.earned)
  const pct = achievements?.length ? Math.round(earned.length / achievements.length * 100) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Достижения" />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Bento — stats */}
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 1fr 1fr', gap:12 }}>

            {/* Главный блок — прогресс */}
            <div style={{ ...card({ background:c.dark, border:`1px solid ${c.dark}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }) }}>
              <div style={{ position:'relative', width:120, height:120, marginBottom:16 }}>
                <svg width="120" height="120" style={{ transform:'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={c.amber} strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - pct / 100)}
                    strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:28, fontWeight:700, color:'#fff', letterSpacing:'-1px' }}>{pct}%</span>
                </div>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{earned.length} из {achievements?.length ?? 0}</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>достижений</p>
            </div>

            {/* Стрики */}
            {[
              { label:'Стрик еды', val: streaks?.food?.current_streak ?? 0, sub:`Рекорд: ${streaks?.food?.longest_streak ?? 0}` },
              { label:'Стрик воды', val: streaks?.water?.current_streak ?? 0, sub:`Рекорд: ${streaks?.water?.longest_streak ?? 0}` },
              { label:'Стрик активности', val: streaks?.activity?.current_streak ?? 0, sub:`Рекорд: ${streaks?.activity?.longest_streak ?? 0}` },
            ].map(({ label, val, sub }) => (
              <div key={label} style={card()}>
                <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:c.hint, marginBottom:8 }}>{label}</p>
                <div style={{ fontSize:32, fontWeight:700, color:c.primary, letterSpacing:'-1px', lineHeight:1 }}>{val}</div>
                <p style={{ fontSize:11, color: val > 0 ? c.accent : c.hint, marginTop:4 }}>{val > 0 ? '🔥 Серия не прервана' : 'Нет активной серии'}</p>
                <p style={{ fontSize:10, color:c.hint, marginTop:3 }}>{sub} дней</p>
              </div>
            ))}

          </div>

          {/* Полученные */}
          {earned.length > 0 && (
            <div style={card()}>
              <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>🏆 Получено</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10 }}>
                {earned.map((a: any) => (
                  <div key={a.code} style={{ display:'flex', gap:12, padding:14, background:'#eef4d8', borderRadius:10, border:`1px solid #c8e090` }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                      {ICONS[a.icon] ?? '🎯'}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:c.dark }}>{a.name}</p>
                      <p style={{ fontSize:11, color:c.muted }}>{a.description}</p>
                      {a.earned_at && (
                        <p style={{ fontSize:10, color:'#6a8a2a', marginTop:3 }}>
                          {new Date(a.earned_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Не получено */}
          {notEarned.length > 0 && (
            <div style={card()}>
              <p style={{ fontSize:13, fontWeight:600, color:c.primary, marginBottom:14 }}>🔒 Предстоит получить</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10 }}>
                {notEarned.map((a: any) => (
                  <div key={a.code} style={{ display:'flex', gap:12, padding:14, background:c.bg, borderRadius:10, border:`1px solid ${c.border}`, opacity:0.7 }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:'#e8e4d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, filter:'grayscale(1)' }}>
                      {ICONS[a.icon] ?? '🎯'}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:c.muted }}>{a.name}</p>
                      <p style={{ fontSize:11, color:c.hint }}>{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
