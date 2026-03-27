import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog, WaterLog
from app.models.user import UserProfile
from app.schemas.activity import ActivityLogCreate, WaterLogCreate, ActivityStats, WaterStats, MET_VALUES


def calc_calories(activity_type: str, duration_min: int | None, weight_kg: float, intensity: str | None) -> float | None:
    if not duration_min or not weight_kg:
        return None
    met = MET_VALUES.get(activity_type, 4.0)
    multiplier = {"low": 0.8, "medium": 1.0, "high": 1.2}.get(intensity or "medium", 1.0)
    return round(met * multiplier * weight_kg * (duration_min / 60), 1)


async def create_activity_log(db: AsyncSession, user_id: uuid.UUID, data: ActivityLogCreate, weight_kg: float | None) -> ActivityLog:
    logged_at = data.logged_at or datetime.now(timezone.utc)
    calories = calc_calories(data.activity_type, data.duration_min, weight_kg or 70, data.intensity)

    log = ActivityLog(
        user_id=user_id,
        activity_type=data.activity_type,
        steps=data.steps,
        duration_min=data.duration_min,
        intensity=data.intensity,
        calories_burned=calories,
        notes=data.notes,
        logged_at=logged_at,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_activity_logs(
    db: AsyncSession, user_id: uuid.UUID,
    date: datetime | None = None,
    limit: int = 50,
) -> list[ActivityLog]:
    query = select(ActivityLog).where(ActivityLog.user_id == user_id)
    if date:
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        query = query.where(ActivityLog.logged_at >= day_start, ActivityLog.logged_at < day_end)
    query = query.order_by(desc(ActivityLog.logged_at)).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_activity_log(db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.id == log_id, ActivityLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        return False
    await db.delete(log)
    await db.commit()
    return True


async def get_activity_stats(db: AsyncSession, user_id: uuid.UUID) -> ActivityStats:
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = day_start - timedelta(days=7)

    # Шаги и калории за сегодня
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user_id, ActivityLog.logged_at >= day_start)
    )
    today_logs = list(result.scalars().all())
    steps_today = sum(l.steps or 0 for l in today_logs)
    calories_today = sum(l.calories_burned or 0 for l in today_logs)

    # Шаги и тренировки за неделю
    result = await db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user_id, ActivityLog.logged_at >= week_start)
    )
    week_logs = list(result.scalars().all())
    steps_week = sum(l.steps or 0 for l in week_logs)
    workouts_week = len(week_logs)

    # Цель шагов из профиля
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    steps_goal = profile.steps_goal if profile else None
    steps_pct = round(steps_today / steps_goal * 100, 1) if steps_goal and steps_goal > 0 else None

    return ActivityStats(
        total_steps_today=steps_today,
        total_calories_burned_today=round(calories_today, 1),
        steps_goal=steps_goal,
        steps_progress_pct=steps_pct,
        total_steps_week=steps_week,
        total_workouts_week=workouts_week,
    )


async def create_water_log(db: AsyncSession, user_id: uuid.UUID, data: WaterLogCreate) -> WaterLog:
    logged_at = data.logged_at or datetime.now(timezone.utc)
    log = WaterLog(user_id=user_id, amount_ml=data.amount_ml, logged_at=logged_at)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_water_logs(db: AsyncSession, user_id: uuid.UUID, date: datetime | None = None) -> list[WaterLog]:
    query = select(WaterLog).where(WaterLog.user_id == user_id)
    if date:
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        query = query.where(WaterLog.logged_at >= day_start, WaterLog.logged_at < day_end)
    query = query.order_by(desc(WaterLog.logged_at))
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_water_log(db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(WaterLog).where(WaterLog.id == log_id, WaterLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        return False
    await db.delete(log)
    await db.commit()
    return True


async def get_water_stats(db: AsyncSession, user_id: uuid.UUID) -> WaterStats:
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(WaterLog).where(WaterLog.user_id == user_id, WaterLog.logged_at >= day_start)
    )
    logs = list(result.scalars().all())
    total_ml = sum(l.amount_ml for l in logs)

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    goal_ml = profile.water_goal_ml if profile and profile.water_goal_ml else 2000

    return WaterStats(
        total_ml_today=total_ml,
        goal_ml=goal_ml,
        remaining_ml=max(0, goal_ml - total_ml),
        progress_pct=round(min(total_ml / goal_ml * 100, 100), 1),
    )