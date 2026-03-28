"""Add food items, food logs, saved meals

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "food_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("off_id", sa.String(100), unique=True, nullable=True),
        sa.Column("barcode", sa.String(50), nullable=True),
        sa.Column("name_ru", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("calories_per_100g", sa.Float(), nullable=False),
        sa.Column("protein_per_100g", sa.Float(), server_default="0"),
        sa.Column("fat_per_100g", sa.Float(), server_default="0"),
        sa.Column("carbs_per_100g", sa.Float(), server_default="0"),
        sa.Column("fiber_per_100g", sa.Float(), nullable=True),
        sa.Column("is_custom", sa.Boolean(), server_default="false"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_food_items_off_id", "food_items", ["off_id"])
    op.create_index("ix_food_items_barcode", "food_items", ["barcode"])

    op.create_table(
        "food_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("food_item_id", UUID(as_uuid=True), sa.ForeignKey("food_items.id", ondelete="SET NULL"), nullable=True),
        sa.Column("meal_type", sa.String(20), nullable=False),
        sa.Column("quantity_g", sa.Float(), nullable=False),
        sa.Column("calories", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), server_default="0"),
        sa.Column("fat_g", sa.Float(), server_default="0"),
        sa.Column("carbs_g", sa.Float(), server_default="0"),
        sa.Column("food_name", sa.String(255), nullable=False),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("ai_recognized", sa.Boolean(), server_default="false"),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_food_logs_user_id", "food_logs", ["user_id"])
    op.create_index("ix_food_logs_logged_at", "food_logs", ["logged_at"])

    op.create_table(
        "saved_meals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("total_calories", sa.Float(), nullable=False),
        sa.Column("total_protein_g", sa.Float(), server_default="0"),
        sa.Column("total_fat_g", sa.Float(), server_default="0"),
        sa.Column("total_carbs_g", sa.Float(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_saved_meals_user_id", "saved_meals", ["user_id"])


def downgrade() -> None:
    op.drop_table("saved_meals")
    op.drop_table("food_logs")
    op.drop_table("food_items")