from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserProfile
from app.schemas.profile import ProfileUpdate, CaloriesCalculation


async def get_or_create_profile(db: AsyncSession, user: User) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


async def update_profile(db: AsyncSession, user: User, data: ProfileUpdate) -> UserProfile:
    profile = await get_or_create_profile(db, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


def calculate_calories(profile: UserProfile) -> CaloriesCalculation:
    if not all([profile.gender, profile.current_weight_kg, profile.height_cm, profile.birth_date]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fill in gender, weight, height, and date of birth first",
        )

    age = (datetime.now(timezone.utc) - profile.birth_date.replace(tzinfo=timezone.utc)).days // 365

    # Формула Миффлина-Сан Жеора
    if profile.gender == "male":
        bmr = 10 * profile.current_weight_kg + 6.25 * profile.height_cm - 5 * age + 5
    else:
        bmr = 10 * profile.current_weight_kg + 6.25 * profile.height_cm - 5 * age - 161

    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    multiplier = activity_multipliers.get(profile.activity_level or "sedentary", 1.2)
    tdee = bmr * multiplier

    # Дефицит 500 ккал для похудения
    daily_calories = int(tdee - 500)

    # КБЖУ: белки 30%, жиры 25%, углеводы 45%
    protein_g = int((daily_calories * 0.30) / 4)
    fat_g = int((daily_calories * 0.25) / 9)
    carbs_g = int((daily_calories * 0.45) / 4)

    return CaloriesCalculation(
        daily_calories=daily_calories,
        protein_g=protein_g,
        fat_g=fat_g,
        carbs_g=carbs_g,
        bmr=round(bmr, 1),
        tdee=round(tdee, 1),
    )
