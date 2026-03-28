import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class FoodItem(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "food_items"

    off_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    name_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str | None] = mapped_column(String(255), nullable=True)
    calories_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    protein_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_per_100g: Mapped[float] = mapped_column(Float, default=0.0)
    fiber_per_100g: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class FoodLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "food_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True
    )
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity_g: Mapped[float] = mapped_column(Float, nullable=False)
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_recognized: Mapped[bool] = mapped_column(Boolean, default=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SavedMeal(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "saved_meals"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_calories: Mapped[float] = mapped_column(Float, nullable=False)
    total_protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    total_fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    total_carbs_g: Mapped[float] = mapped_column(Float, default=0.0)