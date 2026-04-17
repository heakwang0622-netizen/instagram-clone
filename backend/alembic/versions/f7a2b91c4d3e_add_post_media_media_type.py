"""add post_media media_type

Revision ID: f7a2b91c4d3e
Revises: a469b8d28f3e
Create Date: 2026-04-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7a2b91c4d3e"
down_revision: Union[str, Sequence[str], None] = "a469b8d28f3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "post_media",
        sa.Column(
            "media_type",
            sa.String(length=16),
            server_default="image",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("post_media", "media_type")
