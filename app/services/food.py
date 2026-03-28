import uuid
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food import FoodItem, FoodLog, SavedMeal
from app.models.user import User, UserProfile
from app.schemas.food import FoodLogCreate, FoodItemCreate, SavedMealCreate, DailySummary

OFF_API = "https://world.openfoodfacts.org/api/v2"


def _calc_nutrition(per_100g: float, quantity_g: float) -> float:
    return round(per_100g * quantity_g / 100, 1)


async def search_food_off(query: str, limit: int = 10) -> list[dict]:
    url = f"{OFF_API}/search"
    params = {
        "search_terms": query,
        "fields": "id,product_name,product_name_ru,nutriments,code",
        "page_size": limit,
        "json": 1,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return []
        data = resp.json()
        results = []
        for p in data.get("products", []):
            n = p.get("nutriments", {})
            name = p.get("product_name_ru") or p.get("product_name") or "Unknown"
            calories = n.get("energy-kcal_100g") or n.get("energy_100g", 0)
            if not calories or not name:
                continue
            results.append({
                "off_id": p.get("id") or p.get("code"),
                "barcode": p.get("code"),
                "name_ru": name,
                "name_en": p.get("product_name"),
                "calories_per_100g": float(calories),
                "protein_per_100g": float(n.get("proteins_100g", 0)),
                "fat_per_100g": float(n.get("fat_100g", 0)),
                "carbs_per_100g": float(n.get("carbohydrates_100g", 0)),
                "fiber_per_100g": float(n.get("fiber_100g", 0)) if n.get("fiber_100g") else None,
            })
        return results


async def get_food_by_barcode_off(barcode: str) -> dict | None:
    url = f"{OFF_API}/product/{barcode}"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params={"fields": "product_name,product_name_ru,nutriments,code"})
        if resp.status_code != 200:
            return None
        data = resp.json()
        p = data.get("product", {})
        n = p.get("nutriments", {})
        name = p.get("product_name_ru") or p.get("product_name")
        calories = n.get("energy-kcal_100g") or n.get("energy_100g")
        if not name or not calories:
            return None
        return {
            "off_id": barcode,
            "barcode": barcode,
            "name_ru": name,
            "name_en": p.get("product_name"),
            "calories_per_100g": float(calories),
            "protein_per_100g": float(n.get("proteins_100g", 0)),
            "fat_per_100g": float(n.get("fat_100g", 0)),
            "carbs_per_100g": float(n.get("carbohydrates_100g", 0)),
            "fiber_per_100g": float(n.get("fiber_100g", 0)) if n.get("fiber_100g") else None,
        }


async def get_or_create_food_item(db: AsyncSession, data: dict, user_id: uuid.UUID | None = None) -> FoodItem:
    if data.get("off_id"):
        result = await db.execute(select(FoodItem).where(FoodItem.off_id == data["off_id"]))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    item = FoodItem(
        off_id=data.get("off_id"),
        barcode=data.get("barcode"),
        name_ru=data["name_ru"],
        name_en=data.get("name_en"),
        calories_per_100g=data["calories_per_100g"],
        protein_per_100g=data.get("protein_per_100g", 0),
        fat_per_100g=data.get("fat_per_100g", 0),
        carbs_per_100g=data.get("carbs_per_100g", 0),
        fiber_per_100g=data.get("fiber_per_100g"),
        is_custom=data.get("is_custom", False),
        created_by=user_id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def create_food_log(db: AsyncSession, user: User, data: FoodLogCreate) -> FoodLog:
    logged_at = data.logged_at or datetime.now(timezone.utc)
    log = FoodLog(
        user_id=user.id,
        food_item_id=data.food_item_id,
        food_name=data.food_name,
        meal_type=data.meal_type,
        quantity_g=data.quantity_g,
        calories=_calc_nutrition(data.calories_per_100g, data.quantity_g),
        protein_g=_calc_nutrition(data.protein_per_100g, data.quantity_g),
        fat_g=_calc_nutrition(data.fat_per_100g, data.quantity_g),
        carbs_g=_calc_nutrition(data.carbs_per_100g, data.quantity_g),
        logged_at=logged_at,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_food_logs(db: AsyncSession, user_id: uuid.UUID, date: datetime | None = None) -> list[FoodLog]:
    query = select(FoodLog).where(FoodLog.user_id == user_id)
    if date:
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        query = query.where(FoodLog.logged_at >= day_start, FoodLog.logged_at < day_end)
    query = query.order_by(desc(FoodLog.logged_at))
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_food_log(db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(FoodLog).where(FoodLog.id == log_id, FoodLog.user_id == user_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        return False
    await db.delete(log)
    await db.commit()
    return True


async def get_daily_summary(db: AsyncSession, user: User, date: datetime) -> DailySummary:
    logs = await get_food_logs(db, user.id, date)

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    by_meal: dict[str, dict] = {}
    totals = {"calories": 0.0, "protein_g": 0.0, "fat_g": 0.0, "carbs_g": 0.0}

    for log in logs:
        meal = log.meal_type
        if meal not in by_meal:
            by_meal[meal] = {"calories": 0.0, "protein_g": 0.0, "fat_g": 0.0, "carbs_g": 0.0, "items": []}
        by_meal[meal]["calories"] += log.calories
        by_meal[meal]["protein_g"] += log.protein_g
        by_meal[meal]["fat_g"] += log.fat_g
        by_meal[meal]["carbs_g"] += log.carbs_g
        by_meal[meal]["items"].append(log.food_name)
        totals["calories"] += log.calories
        totals["protein_g"] += log.protein_g
        totals["fat_g"] += log.fat_g
        totals["carbs_g"] += log.carbs_g

    cal_goal = profile.daily_calories_goal if profile else None
    cal_remaining = round(cal_goal - totals["calories"], 1) if cal_goal else None

    return DailySummary(
        total_calories=round(totals["calories"], 1),
        total_protein_g=round(totals["protein_g"], 1),
        total_fat_g=round(totals["fat_g"], 1),
        total_carbs_g=round(totals["carbs_g"], 1),
        calories_goal=cal_goal,
        calories_remaining=cal_remaining,
        protein_goal_g=profile.protein_goal_g if profile else None,
        fat_goal_g=profile.fat_goal_g if profile else None,
        carbs_goal_g=profile.carbs_goal_g if profile else None,
        by_meal=by_meal,
    )


async def create_saved_meal(db: AsyncSession, user_id: uuid.UUID, data: SavedMealCreate) -> SavedMeal:
    meal = SavedMeal(user_id=user_id, **data.model_dump())
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


async def get_saved_meals(db: AsyncSession, user_id: uuid.UUID) -> list[SavedMeal]:
    result = await db.execute(
        select(SavedMeal).where(SavedMeal.user_id == user_id).order_by(desc(SavedMeal.created_at))
    )
    return list(result.scalars().all())