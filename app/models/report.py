import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class WeeklyReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "weekly_reports"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    avg_calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_steps: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_workouts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    water_days_hit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_start_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_end_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_delta_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    streak_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)