"""Add preferred_code_language to user LLM configs.

Revision ID: 0003_preferred_code_language
Revises: 0002_importance_levels
Create Date: 2026-07-12

Restored to match databases that already applied this revision.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_preferred_code_language"
down_revision: Union[str, None] = "0002_importance_levels"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_llm_configs",
        sa.Column(
            "preferred_code_language",
            sa.String(length=32),
            nullable=False,
            server_default="java",
        ),
    )
    op.alter_column("user_llm_configs", "preferred_code_language", server_default=None)


def downgrade() -> None:
    op.drop_column("user_llm_configs", "preferred_code_language")
