from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user_dep
from app.models.user import User
from app.schemas.report import WeeklyReportResponse
from app.services.report import generate_weekly_report, get_weekly_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/weekly/generate", response_model=WeeklyReportResponse, status_code=201)
async def generate_report(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await generate_weekly_report(db, current_user.id)


@router.get("/weekly", response_model=list[WeeklyReportResponse])
async def list_reports(
    limit: int = 10,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    return await get_weekly_reports(db, current_user.id, limit)