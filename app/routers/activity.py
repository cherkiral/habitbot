import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User, UserProfile
from app.schemas.activity import (
    ActivityLogCreate, ActivityLogResponse, ActivityStats,
    WaterLogCreate, WaterLogResponse, WaterStats,
)
from app.services.activity import (
    create_activity_log, get_activity_logs, delete_activity_log, get_activity_stats,
    create_water_log, get_water_logs, delete_water_log, get_water_stats,
)

router = APIRouter(tags=["activity"])


# --- Activity ---

@router.post("/activity/logs", response_model=ActivityLogResponse, status_code=201)
async def add_activity_log(
    body: ActivityLogCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    weight_kg = profile.current_weight_kg if profile else None
    return await create_activity_log(db, current_user.id, body, weight_kg)


@router.get("/activity/logs", response_model=list[ActivityLogResponse])
async def list_activity_logs(
    date: datetime | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_activity_logs(db, current_user.id, date, limit)


@router.delete("/activity/logs/{log_id}", status_code=204)
async def remove_activity_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_activity_log(db, current_user.id, log_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")


@router.get("/activity/stats", response_model=ActivityStats)
async def activity_stats(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_activity_stats(db, current_user.id)


# --- Water ---

@router.post("/water/logs", response_model=WaterLogResponse, status_code=201)
async def add_water_log(
    body: WaterLogCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_water_log(db, current_user.id, body)


@router.get("/water/logs", response_model=list[WaterLogResponse])
async def list_water_logs(
    date: datetime | None = None,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_water_logs(db, current_user.id, date)


@router.delete("/water/logs/{log_id}", status_code=204)
async def remove_water_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_water_log(db, current_user.id, log_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")


@router.get("/water/stats", response_model=WaterStats)
async def water_stats(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_water_stats(db, current_user.id)