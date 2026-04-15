"""add_doctor_profile_fields

Revision ID: b2c3d4e5f6g7
Revises: 20a6a425cee7
Create Date: 2026-04-15 00:00:00.000000

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, Sequence[str], None] = "20a6a425cee7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("specialty", sa.String(length=255), nullable=True))
    op.add_column(
        "users", sa.Column("license_number", sa.String(length=255), nullable=True)
    )
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "phone")
    op.drop_column("users", "license_number")
    op.drop_column("users", "specialty")
