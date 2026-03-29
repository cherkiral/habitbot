import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


ACTIVITY_TYPES = [
    "walking", "running", "cycling", "swimming",
    "strength", "yoga", "hiking", "other"
]

MET_VALUES = {
    "walking": 3.5,
    "running": 8.0,
    "cycling": 6.0,
    "swimming": 6.0,
    "strength": 4.0,
    "yoga": 2.5,
    "hiking": 5.0,
    "other": 4.0,
}


class ActivityLogCreate(BaseModel):
    activity_type: str
    steps: int | None = None
    duration_min: int | None = None
    intensity: str | None = None
    notes: str | None = None
    logged_at: datetime | None = None

    @field_validator("activity_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ACTIVITY_TYPES:
            raise ValueError(f"activity_type must be one of: {', '.join(ACTIVITY_TYPES)}")
        return v

    @field_validator("intensity")
    @classmethod
    def validate_intensity(cls, v: str | None) -> str | None:
        if v and v not in ("low", "medium", "high"):
            raise ValueError("intensity must be low, medium or high")
        return v


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    activity_type: str
    steps: int | None
    duration_min: int | None
    intensity: str | None
    calories_burned: float | None
    notes: str | None
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class DaySteps(BaseModel):
    date: str       # YYYY-MM-DD
    day: str        # пн / вт / ...
    steps: int
    has_data: bool  # False для будущих дней


class ActivityStats(BaseModel):
    total_steps_today: int
    total_calories_burned_today: float
    steps_goal: int | None
    steps_progress_pct: float | None
    total_steps_week: int
    total_workouts_week: int
    steps_by_day: list[DaySteps]   # шаги за каждый из 7 дней текущей недели


class WaterLogCreate(BaseModel):
    amount_ml: int
    logged_at: datetime | None = None

    @field_validator("amount_ml")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0 or v > 5000:
            raise ValueError("amount_ml must be between 1 and 5000")
        return v


class WaterLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount_ml: int
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class WaterStats(BaseModel):
    total_ml_today: int
    goal_ml: int
    remaining_ml: int
    progress_pct: float
