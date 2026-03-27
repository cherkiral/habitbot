from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.profile import ProfileUpdate, ProfileResponse, CaloriesCalculation, CaloriesGoalUpdate
from app.services.profile import get_or_create_profile, update_profile, calculate_calories

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_dep)):
    return current_user


@router.get("/me/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_profile(db, current_user)
    return profile


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await update_profile(db, current_user, body)


@router.post("/me/profile/calculate", response_model=CaloriesCalculation)
async def calculate_my_calories(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_profile(db, current_user)
    return calculate_calories(profile)


@router.put("/me/profile/goals", response_model=ProfileResponse)
async def set_calories_goal(
    body: CaloriesGoalUpdate,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    data = ProfileUpdate(
        daily_calories_goal=body.daily_calories_goal,
        protein_goal_g=body.protein_goal_g,
        fat_goal_g=body.fat_goal_g,
        carbs_goal_g=body.carbs_goal_g,
    )
    return await update_profile(db, current_user, data)
