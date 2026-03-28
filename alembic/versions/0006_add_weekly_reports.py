"""Add weekly reports

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "weekly_reports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("avg_calories", sa.Float(), nullable=True),
        sa.Column("avg_protein_g", sa.Float(), nullable=True),
        sa.Column("avg_fat_g", sa.Float(), nullable=True),
        sa.Column("avg_carbs_g", sa.Float(), nullable=True),
        sa.Column("avg_steps", sa.Float(), nullable=True),
        sa.Column("total_workouts", sa.Integer(), nullable=True),
        sa.Column("water_days_hit", sa.Integer(), nullable=True),
        sa.Column("weight_start_kg", sa.Float(), nullable=True),
        sa.Column("weight_end_kg", sa.Float(), nullable=True),
        sa.Column("weight_delta_kg", sa.Float(), nullable=True),
        sa.Column("streak_days", sa.Integer(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_weekly_reports_user_id", "weekly_reports", ["user_id"])


def downgrade() -> None:
    op.drop_table("weekly_reports")