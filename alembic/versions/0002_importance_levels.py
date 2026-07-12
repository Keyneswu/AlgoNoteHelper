"""Remap practice note importance from 1-5 to 1-3.

Revision ID: 0002_importance_levels
Revises: 0001_init
Create Date: 2026-07-11

Old scale (higher = more important, 1-5) maps to:
  4-5 → 3 (high / red)
  3   → 2 (medium / yellow)
  1-2 → 1 (low / green)
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "0002_importance_levels"
down_revision: Union[str, None] = "0001_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE practice_notes
        SET importance = CASE
            WHEN importance >= 4 THEN 3
            WHEN importance = 3 THEN 2
            ELSE 1
        END
        """
    )


def downgrade() -> None:
    # Best-effort reverse: expand 1-3 back toward the old 1-5 midpoints.
    op.execute(
        """
        UPDATE practice_notes
        SET importance = CASE
            WHEN importance = 3 THEN 5
            WHEN importance = 2 THEN 3
            ELSE 1
        END
        """
    )
