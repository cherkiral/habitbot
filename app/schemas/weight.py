import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class WeightLogCreate(BaseModel):
    weight_kg: float
    body_fat_pct: float | None = None
    notes: str | None = None
    logged_at: datetime | None = None

    @field_validator("weight_kg")
    @classmethod
    def weight_must_be_positive(cls, v: float) -> float:
        if v <= 0 or v > 500:
            raise ValueError("Weight must be between 0 and 500 kg")
        return round(v, 1)


class WeightLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    weight_kg: float
    body_fat_pct: float | None
    photo_url: str | None
    notes: str | None
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class WeightStats(BaseModel):
    current_weight_kg: float | None
    start_weight_kg: float | None
    target_weight_kg: float | None
    delta_week_kg: float | None
    delta_month_kg: float | None
    delta_total_kg: float | None
    progress_pct: float | None
    predicted_goal_date: datetime | None


class BodyMeasurementCreate(BaseModel):
    waist_cm: float | None = None
    hips_cm: float | None = None
    chest_cm: float | None = None
    arms_cm: float | None = None
    legs_cm: float | None = None
    notes: str | None = None
    measured_at: datetime | None = None


class BodyMeasurementResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    waist_cm: float | None
    hips_cm: float | None
    chest_cm: float | None
    arms_cm: float | None
    legs_cm: float | None
    notes: str | None
    measured_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True