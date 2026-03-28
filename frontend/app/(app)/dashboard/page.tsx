'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const qc = useQueryClient()

  const { data: weightStats } = useQuery({
    queryKey: ['weight-stats'],
    queryFn: () => api.get('/weight/stats').then(r => r.data),
  })
  const { data: activityStats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => api.get('/activity/stats').then(r => r.data),
  })
  const { data: waterStats } = useQuery({
    queryKey: ['water-stats'],
    queryFn: () => api.get('/water/stats').then(r => r.data),
  })
  const { data: foodSummary } = useQuery({
    queryKey: ['food-summary'],
    queryFn: () => api.get('/food/logs/summary').then(r => r.data),
  })
  const { data: streaks } = useQuery({
    queryKey: ['streaks'],
    queryFn: () => api.get('/streaks').then(r => r.data),
  })
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me/profile').then(r => r.data),
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  const addWater = async (ml: number) => {
    await api.post('/water/logs', { amount_ml: ml })
    qc.invalidateQueries({ queryKey: ['water-stats'] })
  }

  const toGoal = weightStats?.target_weight_kg && weightStats?.current_weight_kg
    ? Math.max(0, weightStats.current_weight_kg - weightStats.target_weight_kg).toFixed(1)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header title="Обзор" />

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Greeting */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2a3010', letterSpacing: '-0.5px' }}>
            {greeting} 👋
          </h2>
          {toGoal && (
            <p style={{ fontSize: 13, color: '#8a9060', marginTop: 4 }}>
              До цели осталось{' '}
              <span style={{ color: '#5a6e2a', fontWeight: 500 }}>{toGoal} кг</span>
              {' '}— продолжай в том же духе!
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard
            label="Калории"
            value={foodSummary?.total_calories?.toFixed(0) ?? '—'}
            unit={foodSummary?.calories_goal ? `/ ${foodSummary.calories_goal}` : 'ккал'}
            delta={foodSummary?.calories_remaining ? `Осталось ${foodSummary.calories_remaining.toFixed(0)} ккал` : undefined}
          />
          <StatCard
            label="Вес"
            value={weightStats?.current_weight_kg?.toFixed(1) ?? '—'}
            unit="кг"
            delta={weightStats?.delta_week_kg ? `${weightStats.delta_week_kg > 0 ? '+' : ''}${weightStats.delta_week_kg} кг за неделю` : undefined}
            deltaType={weightStats?.delta_week_kg < 0 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Шаги"
            value={activityStats?.total_steps_today?.toLocaleString('ru') ?? '—'}
            unit={activityStats?.steps_goal ? `/ ${(activityStats.steps_goal / 1000).toFixed(0)}k` : ''}
            delta={activityStats?.steps_progress_pct ? `${activityStats.steps_progress_pct}% от цели` : undefined}
          />
          <StatCard
            label="Вода"
            value={waterStats?.total_ml_today ?? '—'}
            unit="мл"
            delta={waterStats?.remaining_ml ? `Осталось ${waterStats.remaining_ml} мл` : undefined}
          />
        </div>

        {/* Streak */}
        {streaks?.food && (
          <div style={{
            background: '#3a4a1a',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>🔥</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6daa85', marginBottom: 4 }}>
                Текущий стрик
              </p>
              <p style={{ fontSize: 26, fontWeight: 600, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                {streaks.food.current_streak} {streaks.food.current_streak === 1 ? 'день' : 'дней'}
              </p>
              <p style={{ fontSize: 11, color: '#6daa85', marginTop: 3 }}>
                Рекорд: {streaks.food.longest_streak} дней
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < (streaks.food.current_streak % 7 || streaks.food.current_streak)
                    ? '#d97706'
                    : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Water */}
          <Card>
            <CardHeader>
              <CardTitle>Вода сегодня</CardTitle>
              <span style={{ fontSize: 11, color: '#b0b890' }}>
                {waterStats?.total_ml_today ?? 0} / {waterStats?.goal_ml ?? 2500} мл
              </span>
            </CardHeader>
            <Progress
              value={waterStats?.total_ml_today ?? 0}
              max={waterStats?.goal_ml ?? 2500}
              color="#2563eb"
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {[150, 250, 500].map(ml => (
                <Button key={ml} variant="ghost" size="sm" onClick={() => addWater(ml)} style={{ flex: 1 }}>
                  +{ml} мл
                </Button>
              ))}
            </div>
          </Card>

          {/* КБЖУ */}
          <Card>
            <CardHeader>
              <CardTitle>КБЖУ сегодня</CardTitle>
              <span style={{ fontSize: 11, color: '#b0b890' }}>
                {foodSummary?.total_calories?.toFixed(0) ?? 0} ккал
              </span>
            </CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Белки', value: foodSummary?.total_protein_g, goal: profile?.protein_goal_g, color: '#6a8a2a' },
                { label: 'Жиры', value: foodSummary?.total_fat_g, goal: profile?.fat_goal_g, color: '#d97706' },
                { label: 'Углев.', value: foodSummary?.total_carbs_g, goal: profile?.carbs_goal_g, color: '#8a9060' },
              ].map(({ label, value, goal, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#b0b890', width: 44, flexShrink: 0 }}>{label}</span>
                  <Progress value={value ?? 0} max={goal ?? 100} color={color} height={4} style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#b0b890', width: 64, textAlign: 'right' }}>
                    {value?.toFixed(0) ?? 0}/{goal ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
