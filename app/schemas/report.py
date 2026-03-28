import uuid
from datetime import date, datetime

from pydantic import BaseModel


class WeeklyReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    week_start: date
    avg_calories: float | None
    avg_protein_g: float | None
    avg_fat_g: float | None
    avg_carbs_g: float | None
    avg_steps: float | None
    total_workouts: int | None
    water_days_hit: int | None
    weight_start_kg: float | None
    weight_end_kg: float | None
    weight_delta_kg: float | None
    streak_days: int | None
    generated_at: datetime

    class Config:
        from_attributes = True