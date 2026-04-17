"""add users is_admin

Revision ID: c1a4d0f2e9a1
Revises: f7a2b91c4d3e
Create Date: 2026-04-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1a4d0f2e9a1"
down_revision: Union[str, Sequence[str], None] = "f7a2b91c4d3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_admin",
            sa.Boolean(),
            server_default="0",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
