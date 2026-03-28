'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Flame } from 'lucide-react'

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
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Обзор" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        <div>
          <h2 className="text-xl font-semibold text-primary tracking-tight">{greeting} 👋</h2>
          {toGoal && (
            <p className="text-sm text-muted mt-1">
              До цели осталось <span className="text-secondary font-medium">{toGoal} кг</span> — продолжай в том же духе!
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Калории"
            value={foodSummary?.total_calories?.toFixed(0) ?? '—'}
            unit={foodSummary?.calories_goal ? `/ ${foodSummary.calories_goal}` : 'ккал'}
            delta={foodSummary?.calories_remaining ? `Осталось ${foodSummary.calories_remaining.toFixed(0)} ккал` : undefined}
            deltaType="neutral"
          />
          <StatCard
            label="Вес"
            value={weightStats?.current_weight_kg?.toFixed(1) ?? '—'}
            unit="кг"
            delta={weightStats?.delta_week_kg ? `${weightStats.delta_week_kg > 0 ? '+' : ''}${weightStats.delta_week_kg} кг за неделю` : undefined}
            deltaType={weightStats?.delta_week_kg < 0 ? 'up' : 'down'}
          />
          <StatCard
            label="Шаги"
            value={activityStats?.total_steps_today?.toLocaleString('ru') ?? '—'}
            unit={activityStats?.steps_goal ? `/ ${(activityStats.steps_goal / 1000).toFixed(0)}k` : ''}
            delta={activityStats?.steps_progress_pct ? `${activityStats.steps_progress_pct}% от цели` : undefined}
            deltaType="neutral"
          />
          <StatCard
            label="Вода"
            value={waterStats?.total_ml_today ?? '—'}
            unit="мл"
            delta={waterStats?.remaining_ml ? `Осталось ${waterStats.remaining_ml} мл` : undefined}
            deltaType="neutral"
          />
        </div>

        {streaks?.food && (
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: 'var(--accent-dark)', color: 'white' }}>
            <Flame size={28} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-0.5">Текущий стрик</p>
              <p className="text-2xl font-semibold tracking-tight leading-none">
                {streaks.food.current_streak} {streaks.food.current_streak === 1 ? 'день' : 'дней'}
              </p>
              <p className="text-xs opacity-50 mt-0.5">Рекорд: {streaks.food.longest_streak} дней</p>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: i < (streaks.food.current_streak % 7) ? '#d97706' : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Вода сегодня</CardTitle>
              <span className="text-xs text-hint">{waterStats?.total_ml_today ?? 0} / {waterStats?.goal_ml ?? 2500} мл</span>
            </CardHeader>
            <Progress value={waterStats?.total_ml_today ?? 0} max={waterStats?.goal_ml ?? 2500} color="#2563eb" className="mb-3" />
            <div className="flex gap-2">
              {[150, 250, 500].map(ml => (
                <Button key={ml} variant="ghost" size="sm" className="flex-1" onClick={() => addWater(ml)}>
                  +{ml} мл
                </Button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>КБЖУ сегодня</CardTitle>
              <span className="text-xs text-hint">{foodSummary?.total_calories?.toFixed(0) ?? 0} ккал</span>
            </CardHeader>
            <div className="space-y-2.5">
              {[
                { label: 'Белки', value: foodSummary?.total_protein_g, goal: profile?.protein_goal_g, color: '#6a8a2a' },
                { label: 'Жиры', value: foodSummary?.total_fat_g, goal: profile?.fat_goal_g, color: '#d97706' },
                { label: 'Углев.', value: foodSummary?.total_carbs_g, goal: profile?.carbs_goal_g, color: '#8a9060' },
              ].map(({ label, value, goal, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-hint w-12 flex-shrink-0">{label}</span>
                  <Progress value={value ?? 0} max={goal ?? 100} color={color} className="flex-1" height={4} />
                  <span className="text-xs font-mono text-hint w-16 text-right">{value?.toFixed(0) ?? 0}/{goal ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
