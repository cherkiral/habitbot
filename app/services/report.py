import uuid
from datetime import datetime, timezone, timedelta, date

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import WeeklyReport
from app.models.food import FoodLog
from app.models.activity import ActivityLog, WaterLog
from app.models.weight import WeightLog
from app.models.streak import Streak
from app.models.user import UserProfile


async def generate_weekly_report(db: AsyncSession, user_id: uuid.UUID) -> WeeklyReport:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=today.weekday())
    week_start_dt = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc)
    week_end_dt = week_start_dt + timedelta(days=7)

    # Еда за неделю
    food_logs = (await db.execute(
        select(FoodLog).where(FoodLog.user_id == user_id,
                              FoodLog.logged_at >= week_start_dt,
                              FoodLog.logged_at < week_end_dt)
    )).scalars().all()

    food_days = {}
    for log in food_logs:
        d = log.logged_at.date()
        if d not in food_days:
            food_days[d] = {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}
        food_days[d]["calories"] += log.calories
        food_days[d]["protein"] += log.protein_g
        food_days[d]["fat"] += log.fat_g
        food_days[d]["carbs"] += log.carbs_g

    avg_calories = round(sum(d["calories"] for d in food_days.values()) / max(len(food_days), 1), 1) if food_days else None
    avg_protein = round(sum(d["protein"] for d in food_days.values()) / max(len(food_days), 1), 1) if food_days else None
    avg_fat = round(sum(d["fat"] for d in food_days.values()) / max(len(food_days), 1), 1) if food_days else None
    avg_carbs = round(sum(d["carbs"] for d in food_days.values()) / max(len(food_days), 1), 1) if food_days else None

    # Активность за неделю
    activity_logs = (await db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user_id,
                                   ActivityLog.logged_at >= week_start_dt,
                                   ActivityLog.logged_at < week_end_dt)
    )).scalars().all()

    total_steps = sum(l.steps or 0 for l in activity_logs)
    total_workouts = len(activity_logs)
    avg_steps = round(total_steps / 7, 0) if total_steps else None

    # Вода за неделю
    profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))).scalar_one_or_none()
    water_goal = profile.water_goal_ml if profile and profile.water_goal_ml else 2000

    water_logs = (await db.execute(
        select(WaterLog).where(WaterLog.user_id == user_id,
                                WaterLog.logged_at >= week_start_dt,
                                WaterLog.logged_at < week_end_dt)
    )).scalars().all()

    water_by_day = {}
    for log in water_logs:
        d = log.logged_at.date()
        water_by_day[d] = water_by_day.get(d, 0) + log.amount_ml
    water_days_hit = sum(1 for ml in water_by_day.values() if ml >= water_goal)

    # Вес за неделю
    weight_logs = (await db.execute(
        select(WeightLog).where(WeightLog.user_id == user_id,
                                 WeightLog.logged_at >= week_start_dt,
                                 WeightLog.logged_at < week_end_dt)
        .order_by(WeightLog.logged_at)
    )).scalars().all()

    weight_start = weight_logs[0].weight_kg if weight_logs else None
    weight_end = weight_logs[-1].weight_kg if weight_logs else None
    weight_delta = round(weight_end - weight_start, 1) if weight_start and weight_end else None

    # Стрик еды
    streak = (await db.execute(
        select(Streak).where(Streak.user_id == user_id, Streak.streak_type == "food")
    )).scalar_one_or_none()
    streak_days = streak.current_streak if streak else 0

    report = WeeklyReport(
        user_id=user_id,
        week_start=week_start,
        avg_calories=avg_calories,
        avg_protein_g=avg_protein,
        avg_fat_g=avg_fat,
        avg_carbs_g=avg_carbs,
        avg_steps=avg_steps,
        total_workouts=total_workouts,
        water_days_hit=water_days_hit,
        weight_start_kg=weight_start,
        weight_end_kg=weight_end,
        weight_delta_kg=weight_delta,
        streak_days=streak_days,
        generated_at=now,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def get_weekly_reports(db: AsyncSession, user_id: uuid.UUID, limit: int = 10) -> list[WeeklyReport]:
    result = await db.execute(
        select(WeeklyReport).where(WeeklyReport.user_id == user_id)
        .order_by(desc(WeeklyReport.week_start)).limit(limit)
    )
    return list(result.scalars().all())