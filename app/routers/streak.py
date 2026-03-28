from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.streak import AllStreaksResponse, AchievementResponse
from app.services.streak import get_all_streaks, get_achievements, seed_achievements

router = APIRouter(tags=["streaks"])


@router.get("/streaks", response_model=AllStreaksResponse)
async def my_streaks(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_streaks(db, current_user.id)


@router.get("/achievements", response_model=list[AchievementResponse])
async def my_achievements(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_achievements(db, current_user.id)