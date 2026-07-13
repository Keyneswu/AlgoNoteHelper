"""Rename practice_notes.importance to difficulty.

Revision ID: 0006_diff_rename
Revises: 0005_unique_note_title
Create Date: 2026-07-13
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "0006_diff_rename"
down_revision: Union[str, None] = "0005_unique_note_title"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("practice_notes", "importance", new_column_name="difficulty")


def downgrade() -> None:
    op.alter_column("practice_notes", "difficulty", new_column_name="importance")
