import uuid
from datetime import date, datetime

from pydantic import BaseModel

STREAK_TYPES = ["food", "weight", "water", "activity"]


class StreakResponse(BaseModel):
    id: uuid.UUID
    streak_type: str
    current_streak: int
    longest_streak: int
    last_logged_date: date | None

    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str
    icon: str
    condition_type: str
    condition_value: int
    earned: bool
    earned_at: datetime | None

    class Config:
        from_attributes = True


class AllStreaksResponse(BaseModel):
    food: StreakResponse | None
    weight: StreakResponse | None
    water: StreakResponse | None
    activity: StreakResponse | None