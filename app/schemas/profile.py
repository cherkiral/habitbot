import uuid
from datetime import datetime

from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    gender: str | None = None
    birth_date: datetime | None = None
    height_cm: float | None = None
    current_weight_kg: float | None = None
    target_weight_kg: float | None = None
    activity_level: str | None = None
    water_goal_ml: int | None = None
    steps_goal: int | None = None
    timezone: str | None = None
    language: str | None = None


class CaloriesGoalUpdate(BaseModel):
    daily_calories_goal: int
    protein_goal_g: int
    fat_goal_g: int
    carbs_goal_g: int


class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    gender: str | None
    birth_date: datetime | None
    height_cm: float | None
    current_weight_kg: float | None
    target_weight_kg: float | None
    activity_level: str | None
    daily_calories_goal: int | None
    protein_goal_g: int | None
    fat_goal_g: int | None
    carbs_goal_g: int | None
    water_goal_ml: int | None
    steps_goal: int | None
    timezone: str
    language: str
    onboarding_completed: bool

    class Config:
        from_attributes = True


class CaloriesCalculation(BaseModel):
    daily_calories: int
    protein_g: int
    fat_g: int
    carbs_g: int
    bmr: float
    tdee: float
