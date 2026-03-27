import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weight import WeightLog, BodyMeasurement
from app.models.user import User, UserProfile
from app.schemas.weight import WeightLogCreate, BodyMeasurementCreate, WeightStats


async def create_weight_log(db: AsyncSession, user: User, data: WeightLogCreate) -> WeightLog:
    logged_at = data.logged_at or datetime.now(timezone.utc)
    log = WeightLog(
        user_id=user.id,
        weight_kg=data.weight_kg,
        body_fat_pct=data.body_fat_pct,
        notes=data.notes,
        logged_at=logged_at,
    )
    db.add(log)

    # Обновить текущий вес в профиле
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        profile.current_weight_kg = data.weight_kg

    await db.commit()
    await db.refresh(log)
    return log


async def get_weight_logs(
    db: AsyncSession, user_id: uuid.UUID,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    limit: int = 100,
) -> list[WeightLog]:
    query = select(WeightLog).where(WeightLog.user_id == user_id)
    if from_date:
        query = query.where(WeightLog.logged_at >= from_date)
    if to_date:
        query = query.where(WeightLog.logged_at <= to_date)
    query = query.order_by(desc(WeightLog.logged_at)).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_weight_log(db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(WeightLog).where(WeightLog.id == log_id, WeightLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        return False
    await db.delete(log)
    await db.commit()
    return True


async def get_weight_stats(db: AsyncSession, user: User) -> WeightStats:
    now = datetime.now(timezone.utc)

    # Последний вес
    result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == user.id)
        .order_by(desc(WeightLog.logged_at)).limit(1)
    )
    latest = result.scalar_one_or_none()

    # Вес неделю назад
    week_ago = now - timedelta(days=7)
    result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == user.id, WeightLog.logged_at <= week_ago)
        .order_by(desc(WeightLog.logged_at)).limit(1)
    )
    week_log = result.scalar_one_or_none()

    # Вес месяц назад
    month_ago = now - timedelta(days=30)
    result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == user.id, WeightLog.logged_at <= month_ago)
        .order_by(desc(WeightLog.logged_at)).limit(1)
    )
    month_log = result.scalar_one_or_none()

    # Самый первый вес
    result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == user.id)
        .order_by(WeightLog.logged_at).limit(1)
    )
    first_log = result.scalar_one_or_none()

    # Профиль для цели
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    current = latest.weight_kg if latest else None
    start = first_log.weight_kg if first_log else None
    target = profile.target_weight_kg if profile else None

    delta_week = round(current - week_log.weight_kg, 1) if current and week_log else None
    delta_month = round(current - month_log.weight_kg, 1) if current and month_log else None
    delta_total = round(current - start, 1) if current and start else None

    # Прогресс к цели
    progress_pct = None
    if current and start and target and start != target:
        progress_pct = round(abs(current - start) / abs(start - target) * 100, 1)

    # Прогноз даты достижения цели (по темпу за последние 7 дней)
    predicted_goal_date = None
    if current and target and delta_week and delta_week != 0:
        weeks_needed = abs(current - target) / abs(delta_week)
        predicted_goal_date = now + timedelta(weeks=weeks_needed)

    return WeightStats(
        current_weight_kg=current,
        start_weight_kg=start,
        target_weight_kg=target,
        delta_week_kg=delta_week,
        delta_month_kg=delta_month,
        delta_total_kg=delta_total,
        progress_pct=progress_pct,
        predicted_goal_date=predicted_goal_date,
    )


async def create_body_measurement(
    db: AsyncSession, user: User, data: BodyMeasurementCreate
) -> BodyMeasurement:
    measured_at = data.measured_at or datetime.now(timezone.utc)
    m = BodyMeasurement(
        user_id=user.id,
        waist_cm=data.waist_cm,
        hips_cm=data.hips_cm,
        chest_cm=data.chest_cm,
        arms_cm=data.arms_cm,
        legs_cm=data.legs_cm,
        notes=data.notes,
        measured_at=measured_at,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


async def get_body_measurements(
    db: AsyncSession, user_id: uuid.UUID, limit: int = 50
) -> list[BodyMeasurement]:
    result = await db.execute(
        select(BodyMeasurement).where(BodyMeasurement.user_id == user_id)
        .order_by(desc(BodyMeasurement.measured_at)).limit(limit)
    )
    return list(result.scalars().all())