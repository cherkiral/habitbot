"""Fix achievements icon column length

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("achievements", "icon", type_=sa.String(50))


def downgrade() -> None:
    op.alter_column("achievements", "icon", type_=sa.String(10))