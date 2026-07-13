"""Unique (user_id, title) on practice_notes after suffixing collisions.

Revision ID: 0005_unique_note_title
Revises: 0004_review_dates
Create Date: 2026-07-13
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "0005_unique_note_title"
down_revision: Union[str, None] = "0004_review_dates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Suffix duplicate titles per user before adding the unique constraint.
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                user_id,
                title,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id, title
                    ORDER BY id
                ) AS rn
            FROM practice_notes
        )
        UPDATE practice_notes AS pn
        SET title = ranked.title || ' (' || ranked.rn || ')'
        FROM ranked
        WHERE pn.id = ranked.id
          AND ranked.rn > 1
        """
    )
    op.create_unique_constraint(
        "uq_practice_notes_user_title",
        "practice_notes",
        ["user_id", "title"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_practice_notes_user_title", "practice_notes", type_="unique")
