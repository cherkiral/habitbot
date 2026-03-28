import uuid
from datetime import datetime, date, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.weight import (
    WeightLogCreate, WeightLogResponse,
    BodyMeasurementCreate, BodyMeasurementResponse,
)
from app.services.weight import (
    create_weight_log, get_weight_logs, delete_weight_log,
    get_weight_stats, create_body_measurement, get_body_measurements,
)
from app.services import weight_analytics as wa

router = APIRouter(prefix="/weight", tags=["weight"])


# ─── Logs ────────────────────────────────────────────────────────────────────

@router.post("/logs", response_model=WeightLogResponse, status_code=201)
async def add_weight_log(
    body: WeightLogCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_weight_log(db, current_user, body)  # fix: User object, not .id


@router.get("/logs", response_model=list[WeightLogResponse])
async def list_weight_logs(
    limit: int = Query(default=50, le=200),
    from_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_weight_logs(db, current_user.id, limit=limit, from_date=from_date)


@router.delete("/logs/{log_id}", status_code=204)
async def remove_weight_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_weight_log(db, current_user.id, log_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def weight_stats(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog

    logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    logs = list(logs_result.scalars().all())

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    target = profile.target_weight_kg if profile else None
    stats = wa.calc_extended_stats(logs, target)

    # Add forecast date to predicted_goal_date
    if len(logs) >= wa.MIN_LOGS_FOR_FORECAST and target:
        forecast = wa.calc_forecast(logs, target)
        if forecast and forecast.get("possible"):
            stats["predicted_goal_date"] = forecast.get("realistic", {}).get("date")
        else:
            stats["predicted_goal_date"] = None

    return stats


# ─── BMI ─────────────────────────────────────────────────────────────────────

@router.get("/bmi")
async def weight_bmi(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    if not profile or not profile.height_cm:
        raise HTTPException(status_code=400, detail="Укажи рост в профиле")

    log_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at.desc()).limit(1)
    )
    last_log = log_result.scalar_one_or_none()
    weight = last_log.weight_kg if last_log else profile.current_weight_kg
    if not weight:
        raise HTTPException(status_code=400, detail="Нет данных о весе")

    bmi = wa.calc_bmi(weight, profile.height_cm)
    category = wa.get_bmi_category(bmi)
    bmi_range = wa.bmi_normal_weight_range(profile.height_cm)
    to_normal = round(weight - bmi_range["max_kg"], 1) if weight > bmi_range["max_kg"] else 0

    result = {
        "bmi":               bmi,
        "category":          category,
        "weight_kg":         weight,
        "height_cm":         profile.height_cm,
        "bmi_normal_range":  bmi_range,
        "to_normal_weight_kg": to_normal,
    }

    if profile.gender:
        ideal = wa.calc_ideal_weight(profile.height_cm, profile.gender)
        result["ideal_weight"] = ideal
        result["to_ideal_weight_kg"] = round(weight - ideal["mean_kg"], 1)

    return result


# ─── Forecast ────────────────────────────────────────────────────────────────

@router.get("/forecast")
async def weight_forecast(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()
    if not profile or not profile.target_weight_kg:
        raise HTTPException(status_code=400, detail="Укажи целевой вес в профиле")

    logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    logs = list(logs_result.scalars().all())

    forecast = wa.calc_forecast(logs, profile.target_weight_kg)
    if forecast is None:
        return {"possible": False, "reason": f"Нужно минимум {wa.MIN_LOGS_FOR_FORECAST} взвешиваний", "logs_count": len(logs)}
    return forecast


# ─── Chart data ───────────────────────────────────────────────────────────────

@router.get("/chart")
async def weight_chart(
    period: int = Query(default=30, ge=7, le=365),
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog
    from datetime import timedelta

    # Все логи нужны для milestones (стартовый вес, прогноз)
    all_logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    all_logs = list(all_logs_result.scalars().all())

    # Логи за выбранный период — для точек графика
    from_dt = datetime.now(timezone.utc) - timedelta(days=period)
    period_logs = [l for l in all_logs if l.logged_at >= from_dt]

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    # Считаем milestones, чтобы отметить их на графике
    milestones = None
    if all_logs:
        start   = all_logs[0].weight_kg
        current = all_logs[-1].weight_kg
        target  = profile.target_weight_kg if profile else None
        height  = profile.height_cm if profile else None
        gender  = profile.gender if profile else None
        forecast = wa.calc_forecast(all_logs, target) if target and len(all_logs) >= wa.MIN_LOGS_FOR_FORECAST else None
        milestones = wa.build_milestones(start, current, target, height, gender, all_logs, forecast)

    return {
        "period_days":      period,
        "points":           wa.build_chart_data(period_logs, milestones),
        "target_weight_kg": profile.target_weight_kg if profile else None,
        "total_points":     len(period_logs),
    }


# ─── Milestones ───────────────────────────────────────────────────────────────

@router.get("/milestones")
async def weight_milestones(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog

    logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    logs = list(logs_result.scalars().all())
    if not logs:
        return []

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    start   = logs[0].weight_kg
    current = logs[-1].weight_kg
    target  = profile.target_weight_kg if profile else None
    height  = profile.height_cm if profile else None
    gender  = profile.gender if profile else None

    forecast = wa.calc_forecast(logs, target) if target and len(logs) >= wa.MIN_LOGS_FOR_FORECAST else None
    return wa.build_milestones(start, current, target, height, gender, logs, forecast)


# ─── Weekly summary ───────────────────────────────────────────────────────────

@router.get("/weekly-summary")
async def weight_weekly_summary(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.weight import WeightLog

    logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    logs = list(logs_result.scalars().all())
    return wa.calc_weekly_summary(logs)


# ─── Recommendations ──────────────────────────────────────────────────────────

@router.get("/recommendations")
async def weight_recommendations(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import WeightLog

    logs_result = await db.execute(
        select(WeightLog).where(WeightLog.user_id == current_user.id).order_by(WeightLog.logged_at)
    )
    logs = list(logs_result.scalars().all())

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    stats = wa.calc_extended_stats(logs, profile.target_weight_kg if profile else None)

    bmi = None
    if profile and profile.height_cm and logs:
        bmi = wa.calc_bmi(logs[-1].weight_kg, profile.height_cm)

    return wa.build_recommendations(stats, bmi)


# ─── Body measurements ────────────────────────────────────────────────────────

@router.post("/body/measurements", response_model=BodyMeasurementResponse, status_code=201)
async def add_measurement(
    body: BodyMeasurementCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_body_measurement(db, current_user, body)  # fix: User object, not .id


@router.get("/body/measurements", response_model=list[BodyMeasurementResponse])
async def list_measurements(
    limit: int = 20,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_body_measurements(db, current_user.id, limit)


@router.get("/body/stats")
async def body_stats(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.user import UserProfile
    from app.models.weight import BodyMeasurement

    result = await db.execute(
        select(BodyMeasurement)
        .where(BodyMeasurement.user_id == current_user.id)
        .order_by(BodyMeasurement.measured_at.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        return {}

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()

    ratios = wa.calc_body_ratios(
        waist_cm=latest.waist_cm,
        hip_cm=latest.hips_cm,
        height_cm=profile.height_cm if profile else None,
        gender=profile.gender if profile else None,
    )

    return {
        "latest_measurement": {
            "measured_at": latest.measured_at.isoformat(),
            "waist_cm":    latest.waist_cm,
            "hips_cm":     latest.hips_cm,
            "chest_cm":    latest.chest_cm,
            "arms_cm":     latest.arms_cm,
            "legs_cm":     latest.legs_cm,
        },
        "ratios": ratios,
    }
