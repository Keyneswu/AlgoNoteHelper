"""Add review_dates to practice notes.

Revision ID: 0004_review_dates
Revises: 0003_preferred_code_language
Create Date: 2026-07-12
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_review_dates"
down_revision: Union[str, None] = "0003_preferred_code_language"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "practice_notes",
        sa.Column(
            "review_dates",
            postgresql.ARRAY(sa.DateTime(timezone=True)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.execute(
        """
        UPDATE practice_notes
        SET review_dates = ARRAY[created_at]
        WHERE cardinality(review_dates) = 0 OR review_dates IS NULL
        """
    )
    op.alter_column("practice_notes", "review_dates", server_default=None)


def downgrade() -> None:
    op.drop_column("practice_notes", "review_dates")
