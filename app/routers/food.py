import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.food import (
    FoodItemCreate, FoodItemResponse,
    FoodLogCreate, FoodLogResponse,
    DailySummary,
    SavedMealCreate, SavedMealResponse,
)
from app.services.food import (
    search_food_off, get_food_by_barcode_off,
    get_or_create_food_item, create_food_log,
    get_food_logs, delete_food_log, get_daily_summary,
    create_saved_meal, get_saved_meals,
)

router = APIRouter(prefix="/food", tags=["food"])


@router.get("/search", response_model=list[FoodItemResponse])
async def search_food(
    q: str = Query(min_length=2),
    limit: int = Query(default=10, le=30),
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    results = await search_food_off(q, limit)
    items = []
    for r in results:
        item = await get_or_create_food_item(db, r)
        items.append(item)
    return items


@router.get("/barcode/{barcode}", response_model=FoodItemResponse)
async def get_by_barcode(
    barcode: str,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    data = await get_food_by_barcode_off(barcode)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    item = await get_or_create_food_item(db, data)
    return item


@router.post("/items", response_model=FoodItemResponse, status_code=201)
async def create_custom_food(
    body: FoodItemCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    data["is_custom"] = True
    return await get_or_create_food_item(db, data, user_id=current_user.id)


@router.post("/logs", response_model=FoodLogResponse, status_code=201)
async def add_food_log(
    body: FoodLogCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_food_log(db, current_user, body)


@router.get("/logs", response_model=list[FoodLogResponse])
async def list_food_logs(
    date: datetime | None = None,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_food_logs(db, current_user.id, date)


@router.delete("/logs/{log_id}", status_code=204)
async def remove_food_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_food_log(db, current_user.id, log_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")


@router.get("/logs/summary", response_model=DailySummary)
async def daily_summary(
    date: datetime | None = None,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    from datetime import timezone
    target_date = date or datetime.now(timezone.utc)
    return await get_daily_summary(db, current_user, target_date)


@router.post("/saved-meals", response_model=SavedMealResponse, status_code=201)
async def save_meal(
    body: SavedMealCreate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await create_saved_meal(db, current_user.id, body)


@router.get("/saved-meals", response_model=list[SavedMealResponse])
async def list_saved_meals(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_saved_meals(db, current_user.id)