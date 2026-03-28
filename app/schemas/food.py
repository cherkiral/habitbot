import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"]


class FoodItemCreate(BaseModel):
    name_ru: str
    name_en: str | None = None
    calories_per_100g: float
    protein_per_100g: float = 0.0
    fat_per_100g: float = 0.0
    carbs_per_100g: float = 0.0
    fiber_per_100g: float | None = None


class FoodItemResponse(BaseModel):
    id: uuid.UUID
    off_id: str | None
    barcode: str | None
    name_ru: str
    name_en: str | None
    calories_per_100g: float
    protein_per_100g: float
    fat_per_100g: float
    carbs_per_100g: float
    fiber_per_100g: float | None
    is_custom: bool

    class Config:
        from_attributes = True


class FoodLogCreate(BaseModel):
    food_item_id: uuid.UUID | None = None
    food_name: str
    meal_type: str
    quantity_g: float
    calories_per_100g: float
    protein_per_100g: float = 0.0
    fat_per_100g: float = 0.0
    carbs_per_100g: float = 0.0
    logged_at: datetime | None = None

    @field_validator("meal_type")
    @classmethod
    def validate_meal_type(cls, v: str) -> str:
        if v not in MEAL_TYPES:
            raise ValueError(f"meal_type must be one of: {', '.join(MEAL_TYPES)}")
        return v

    @field_validator("quantity_g")
    @classmethod
    def validate_quantity(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("quantity_g must be positive")
        return round(v, 1)


class FoodLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    food_item_id: uuid.UUID | None
    food_name: str
    meal_type: str
    quantity_g: float
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    photo_url: str | None
    ai_recognized: bool
    logged_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class DailySummary(BaseModel):
    total_calories: float
    total_protein_g: float
    total_fat_g: float
    total_carbs_g: float
    calories_goal: int | None
    calories_remaining: float | None
    protein_goal_g: int | None
    fat_goal_g: int | None
    carbs_goal_g: int | None
    by_meal: dict[str, dict]


class SavedMealCreate(BaseModel):
    name: str
    total_calories: float
    total_protein_g: float = 0.0
    total_fat_g: float = 0.0
    total_carbs_g: float = 0.0


class SavedMealResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    total_calories: float
    total_protein_g: float
    total_fat_g: float
    total_carbs_g: float
    created_at: datetime

    class Config:
        from_attributes = True