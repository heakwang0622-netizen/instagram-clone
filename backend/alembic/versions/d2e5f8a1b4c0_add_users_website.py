"""add users website

Revision ID: d2e5f8a1b4c0
Revises: c1a4d0f2e9a1
Create Date: 2026-04-14
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d2e5f8a1b4c0"
down_revision: Union[str, Sequence[str], None] = "c1a4d0f2e9a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("website", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "website")
