"""Add streaks and achievements

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "streaks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("streak_type", sa.String(20), nullable=False),
        sa.Column("current_streak", sa.Integer(), server_default="0"),
        sa.Column("longest_streak", sa.Integer(), server_default="0"),
        sa.Column("last_logged_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_streaks_user_id", "streaks", ["user_id"])

    op.create_table(
        "achievements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("icon", sa.String(50), nullable=False),
        sa.Column("condition_type", sa.String(50), nullable=False),
        sa.Column("condition_value", sa.Integer(), nullable=False),
    )

    op.create_table(
        "user_achievements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("achievement_id", UUID(as_uuid=True), sa.ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_achievements")
    op.drop_table("achievements")
    op.drop_table("streaks")