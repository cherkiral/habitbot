import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.weight import (
    WeightLogCreate, WeightLogResponse, WeightStats,
    BodyMeasurementCreate, BodyMeasurementResponse,
)
from app.services.weight import (
    create_weight_log, get_weight_logs, delete_weight_log,
    get_weight_stats, create_body_measurement, get_body_measurements,
)

router = APIRouter(prefix="/weight", tags=["weight"])


@router.post("/logs", response_model=WeightLogResponse, status_code=201)
async def add_weight_log(
    body: WeightLogCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_weight_log(db, current_user, body)


@router.get("/logs", response_model=list[WeightLogResponse])
async def list_weight_logs(
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_weight_logs(db, current_user.id, from_date, to_date, limit)


@router.delete("/logs/{log_id}", status_code=204)
async def remove_weight_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_weight_log(db, current_user.id, log_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")


@router.get("/stats", response_model=WeightStats)
async def weight_stats(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_weight_stats(db, current_user)


@router.post("/body/measurements", response_model=BodyMeasurementResponse, status_code=201)
async def add_body_measurement(
    body: BodyMeasurementCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_body_measurement(db, current_user, body)


@router.get("/body/measurements", response_model=list[BodyMeasurementResponse])
async def list_body_measurements(
    limit: int = 50,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_body_measurements(db, current_user.id, limit)