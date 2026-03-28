'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/store/auth'

const c = { bg:'#faf8f0', card:'#ffffff', border:'#ddd8c0', muted:'#8a9060', hint:'#b0b890', primary:'#2a3010', accent:'#6a8a2a', dark:'#3a4a1a', red:'#dc2626' }
const card = (e?: React.CSSProperties): React.CSSProperties => ({ background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:20, ...e })
const inp = (e?: React.CSSProperties): React.CSSProperties => ({ width:'100%', padding:'9px 12px', border:`1px solid ${c.border}`, borderRadius:8, fontSize:13, color:c.primary, outline:'none', fontFamily:"'DM Sans',sans-serif", background:c.bg, ...e })
const label = (text: string) => <p style={{ fontSize:11, color:c.muted, marginBottom:5 }}>{text}</p>
const section = (title: string) => <p style={{ fontSize:12, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:c.hint, marginBottom:14 }}>{title}</p>

export default function SettingsPage() {
  const qc = useQueryClient()
  const { user, logout } = useAuth()

  const { data: profile } = useQuery({ queryKey:['profile'], queryFn: () => api.get('/users/me/profile').then(r => r.data) })

  const [form, setForm] = useState({
    gender: '', birthday: '', height_cm: '', current_weight_kg: '', target_weight_kg: '',
    activity_level: 'moderate', goal_type: 'loss', water_goal_ml: '', steps_goal: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        gender: profile.gender || '',
        birthday: profile.birthday ? profile.birthday.slice(0, 10) : '',
        height_cm: profile.height_cm?.toString() || '',
        current_weight_kg: profile.current_weight_kg?.toString() || '',
        target_weight_kg: profile.target_weight_kg?.toString() || '',
        activity_level: profile.activity_level || 'moderate',
        goal_type: profile.goal_type || 'loss',
        water_goal_ml: profile.water_goal_ml?.toString() || '2500',
        steps_goal: profile.steps_goal?.toString() || '10000',
      })
    }
  }, [profile])

  const save = useMutation({
    mutationFn: () => api.put('/users/me/profile', {
      gender: form.gender || undefined,
      birthday: form.birthday || undefined,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
      current_weight_kg: form.current_weight_kg ? parseFloat(form.current_weight_kg) : undefined,
      target_weight_kg: form.target_weight_kg ? parseFloat(form.target_weight_kg) : undefined,
      activity_level: form.activity_level,
      goal_type: form.goal_type,
      water_goal_ml: form.water_goal_ml ? parseInt(form.water_goal_ml) : undefined,
      steps_goal: form.steps_goal ? parseInt(form.steps_goal) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['profile'] }); setSaved(true); setTimeout(() => setSaved(false), 2000) },
  })

  const calcKbju = useMutation({
    mutationFn: () => api.post('/users/me/profile/calculate'),
    onSuccess: () => qc.invalidateQueries({ queryKey:['profile'] }),
  })

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <Header title="Настройки" />
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:c.bg }}>
        <div style={{ maxWidth:800, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Профиль */}
          <div style={card()}>
            {section('Профиль')}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, padding:14, background:c.bg, borderRadius:10, border:`1px solid ${c.border}` }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:c.dark, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:600, flexShrink:0 }}>
                {user?.username?.slice(0,2).toUpperCase() || user?.email?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:c.primary }}>{user?.username || 'Пользователь'}</p>
                <p style={{ fontSize:12, color:c.muted }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                {label('Пол')}
                <select style={{ ...inp(), cursor:'pointer' }} {...f('gender')}>
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div>
                {label('Дата рождения')}
                <input type="date" style={inp()} {...f('birthday')} />
              </div>
              <div>
                {label('Рост (см)')}
                <input type="number" placeholder="175" style={inp()} {...f('height_cm')} />
              </div>
              <div>
                {label('Текущий вес (кг)')}
                <input type="number" step="0.1" placeholder="90.0" style={inp()} {...f('current_weight_kg')} />
              </div>
              <div>
                {label('Целевой вес (кг)')}
                <input type="number" step="0.1" placeholder="80.0" style={inp()} {...f('target_weight_kg')} />
              </div>
              <div>
                {label('Уровень активности')}
                <select style={{ ...inp(), cursor:'pointer' }} {...f('activity_level')}>
                  <option value="sedentary">Сидячий</option>
                  <option value="light">Лёгкий</option>
                  <option value="moderate">Умеренный</option>
                  <option value="active">Активный</option>
                  <option value="very_active">Очень активный</option>
                </select>
              </div>
            </div>
          </div>

          {/* Цели */}
          <div style={card()}>
            {section('Цели')}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                {label('Тип цели')}
                <select style={{ ...inp(), cursor:'pointer' }} {...f('goal_type')}>
                  <option value="loss">Похудение</option>
                  <option value="maintain">Поддержание</option>
                  <option value="gain">Набор массы</option>
                </select>
              </div>
              <div>
                {label('Норма воды (мл)')}
                <input type="number" placeholder="2500" style={inp()} {...f('water_goal_ml')} />
              </div>
              <div>
                {label('Цель шагов')}
                <input type="number" placeholder="10000" style={inp()} {...f('steps_goal')} />
              </div>
            </div>

            {profile?.daily_calories_goal && (
              <div style={{ marginTop:14, padding:14, background:'#eef4d8', borderRadius:10, border:`1px solid #c8e090` }}>
                <p style={{ fontSize:11, color:c.accent, fontWeight:600, marginBottom:8 }}>Текущие нормы КБЖУ</p>
                <div style={{ display:'flex', gap:20 }}>
                  {[
                    { l:'Калории', v:`${profile.daily_calories_goal} ккал` },
                    { l:'Белки', v:`${profile.protein_goal_g} г` },
                    { l:'Жиры', v:`${profile.fat_goal_g} г` },
                    { l:'Углеводы', v:`${profile.carbs_goal_g} г` },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p style={{ fontSize:10, color:c.hint }}>{l}</p>
                      <p style={{ fontSize:14, fontWeight:600, color:c.dark }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={() => calcKbju.mutate()} disabled={calcKbju.isPending} style={{
                padding:'9px 16px', border:`1px solid ${c.border}`, borderRadius:8,
                background:'transparent', fontSize:13, color:c.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              }}>🔄 Пересчитать КБЖУ</button>
            </div>
          </div>

          {/* Сохранить */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={() => save.mutate()} disabled={save.isPending} style={{
              padding:'10px 28px', background:c.accent, color:'#fff', border:'none', borderRadius:8,
              fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
            }}>{save.isPending ? 'Сохраняем...' : 'Сохранить изменения'}</button>
            {saved && <span style={{ fontSize:13, color:c.accent }}>✓ Сохранено</span>}
          </div>

          {/* Выход */}
          <div style={card()}>
            {section('Аккаунт')}
            <button onClick={logout} style={{
              padding:'9px 20px', border:`1px solid #fecaca`, borderRadius:8,
              background:'#fef2f2', fontSize:13, color:c.red, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500,
            }}>Выйти из аккаунта</button>
          </div>

        </div>
      </div>
    </div>
  )
}
