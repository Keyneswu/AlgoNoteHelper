"""Initial practice notes + LLM config + pgvector.

Revision ID: 0001_init
Revises:
Create Date: 2026-07-11
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "practice_notes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("approach", sa.Text(), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("pitfalls", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("importance", sa.Integer(), nullable=False),
        sa.Column("source_meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("embedding_model", sa.String(length=256), nullable=True),
        sa.Column("embedding", Vector(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_practice_notes_user_id", "practice_notes", ["user_id"])

    op.create_table(
        "user_llm_configs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("chat_provider", sa.String(length=64), nullable=False),
        sa.Column("chat_base_url", sa.String(length=512), nullable=False),
        sa.Column("chat_model", sa.String(length=128), nullable=False),
        sa.Column("chat_api_key_enc", sa.Text(), nullable=True),
        sa.Column("chat_verified", sa.Boolean(), nullable=False),
        sa.Column("embedding_provider", sa.String(length=64), nullable=False),
        sa.Column("embedding_base_url", sa.String(length=512), nullable=False),
        sa.Column("embedding_model", sa.String(length=128), nullable=False),
        sa.Column("embedding_api_key_enc", sa.Text(), nullable=True),
        sa.Column("embedding_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_llm_configs_user_id"),
    )
    op.create_index("ix_user_llm_configs_user_id", "user_llm_configs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_llm_configs_user_id", table_name="user_llm_configs")
    op.drop_table("user_llm_configs")
    op.drop_index("ix_practice_notes_user_id", table_name="practice_notes")
    op.drop_table("practice_notes")
