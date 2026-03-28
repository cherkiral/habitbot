import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.streak import Streak, Achievement, UserAchievement
from app.models.food import FoodLog
from app.models.weight import WeightLog
from app.models.activity import ActivityLog, WaterLog
from app.models.user import UserProfile
from app.schemas.streak import StreakResponse, AchievementResponse, AllStreaksResponse

STREAK_TYPES = ["food", "weight", "water", "activity"]

ACHIEVEMENTS_SEED = [
    {"code": "first_log", "name": "Первый шаг", "description": "Первая запись в дневнике", "icon": "star", "condition_type": "food_logs_total", "condition_value": 1},
    {"code": "streak_7_food", "name": "Неделя питания", "description": "7 дней подряд записей еды", "icon": "fire", "condition_type": "food_streak", "condition_value": 7},
    {"code": "streak_30_food", "name": "Месяц питания", "description": "30 дней подряд записей еды", "icon": "crown", "condition_type": "food_streak", "condition_value": 30},
    {"code": "streak_7_water", "name": "Неделя воды", "description": "7 дней подряд трекинга воды", "icon": "droplet", "condition_type": "water_streak", "condition_value": 7},
    {"code": "streak_7_activity", "name": "Неделя активности", "description": "7 дней подряд тренировок", "icon": "zap", "condition_type": "activity_streak", "condition_value": 7},
    {"code": "weight_minus_1", "name": "Минус 1 кг", "description": "Сбросил первый килограмм", "icon": "trending-down", "condition_type": "weight_lost_kg", "condition_value": 1},
    {"code": "weight_minus_5", "name": "Минус 5 кг", "description": "Сбросил 5 килограммов", "icon": "award", "condition_type": "weight_lost_kg", "condition_value": 5},
    {"code": "steps_10k", "name": "10 000 шагов", "description": "Прошёл 10 000 шагов за день", "icon": "footprints", "condition_type": "steps_day", "condition_value": 10000},
    {"code": "water_7_days", "name": "Водный марафон", "description": "Выполнил норму воды 7 раз", "icon": "droplets", "condition_type": "water_goal_days", "condition_value": 7},
    {"code": "streak_weight_7", "name": "Неделя взвешиваний", "description": "7 дней подряд записей веса", "icon": "scale", "condition_type": "weight_streak", "condition_value": 7},
]


async def seed_achievements(db: AsyncSession) -> None:
    for a in ACHIEVEMENTS_SEED:
        result = await db.execute(select(Achievement).where(Achievement.code == a["code"]))
        if not result.scalar_one_or_none():
            db.add(Achievement(**a))
    await db.commit()


async def get_or_create_streak(db: AsyncSession, user_id: uuid.UUID, streak_type: str) -> Streak:
    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id, Streak.streak_type == streak_type)
    )
    streak = result.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=user_id, streak_type=streak_type)
        db.add(streak)
        await db.commit()
        await db.refresh(streak)
    return streak


async def update_streak(db: AsyncSession, user_id: uuid.UUID, streak_type: str) -> Streak:
    streak = await get_or_create_streak(db, user_id, streak_type)
    today = date.today()

    if streak.last_logged_date == today:
        return streak

    if streak.last_logged_date and (today - streak.last_logged_date).days == 1:
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_logged_date = today

    await db.commit()
    await db.refresh(streak)
    return streak


async def get_all_streaks(db: AsyncSession, user_id: uuid.UUID) -> AllStreaksResponse:
    streaks = {}
    for t in STREAK_TYPES:
        streak = await get_or_create_streak(db, user_id, t)
        streaks[t] = StreakResponse.model_validate(streak)
    return AllStreaksResponse(**streaks)


async def check_and_award_achievements(db: AsyncSession, user_id: uuid.UUID) -> list[Achievement]:
    all_achievements = (await db.execute(select(Achievement))).scalars().all()
    earned_ids = set(
        row.achievement_id for row in
        (await db.execute(select(UserAchievement).where(UserAchievement.user_id == user_id))).scalars().all()
    )

    # Данные для проверки
    food_streak = await get_or_create_streak(db, user_id, "food")
    water_streak = await get_or_create_streak(db, user_id, "water")
    activity_streak = await get_or_create_streak(db, user_id, "activity")
    weight_streak = await get_or_create_streak(db, user_id, "weight")

    food_total = len((await db.execute(select(FoodLog).where(FoodLog.user_id == user_id))).scalars().all())

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    weight_logs = (await db.execute(
        select(WeightLog).where(WeightLog.user_id == user_id).order_by(WeightLog.logged_at)
    )).scalars().all()
    weight_lost = 0
    if len(weight_logs) >= 2:
        weight_lost = max(0, weight_logs[0].weight_kg - weight_logs[-1].weight_kg)

    newly_earned = []
    for a in all_achievements:
        if a.id in earned_ids:
            continue

        earned = False
        ct = a.condition_type
        cv = a.condition_value

        if ct == "food_logs_total" and food_total >= cv:
            earned = True
        elif ct == "food_streak" and food_streak.current_streak >= cv:
            earned = True
        elif ct == "water_streak" and water_streak.current_streak >= cv:
            earned = True
        elif ct == "activity_streak" and activity_streak.current_streak >= cv:
            earned = True
        elif ct == "weight_streak" and weight_streak.current_streak >= cv:
            earned = True
        elif ct == "weight_lost_kg" and weight_lost >= cv:
            earned = True

        if earned:
            ua = UserAchievement(
                user_id=user_id,
                achievement_id=a.id,
                earned_at=datetime.now(timezone.utc),
            )
            db.add(ua)
            newly_earned.append(a)

    if newly_earned:
        await db.commit()

    return newly_earned


async def get_achievements(db: AsyncSession, user_id: uuid.UUID) -> list[AchievementResponse]:
    all_achievements = (await db.execute(select(Achievement))).scalars().all()
    earned_map = {
        row.achievement_id: row.earned_at for row in
        (await db.execute(select(UserAchievement).where(UserAchievement.user_id == user_id))).scalars().all()
    }

    result = []
    for a in all_achievements:
        result.append(AchievementResponse(
            id=a.id,
            code=a.code,
            name=a.name,
            description=a.description,
            icon=a.icon,
            condition_type=a.condition_type,
            condition_value=a.condition_value,
            earned=a.id in earned_map,
            earned_at=earned_map.get(a.id),
        ))
    return result