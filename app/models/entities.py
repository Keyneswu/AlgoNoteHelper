from __future__ import annotations

from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base

# Default embedding dimension for text-embedding-v3 / common Bailian models.
EMBEDDING_DIM = 1024


class PracticeNote(Base):
    __tablename__ = "practice_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    statement: Mapped[str] = mapped_column(Text, default="", nullable=False)
    approach: Mapped[str] = mapped_column(Text, default="", nullable=False)
    code: Mapped[str] = mapped_column(Text, default="", nullable=False)
    pitfalls: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, nullable=False)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, nullable=False)
    importance: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    review_dates: Mapped[list[datetime]] = mapped_column(
        ARRAY(DateTime(timezone=True)), default=list, nullable=False
    )
    source_meta: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(256), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class UserLlmConfig(Base):
    __tablename__ = "user_llm_configs"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_llm_configs_user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    chat_provider: Mapped[str] = mapped_column(String(64), default="deepseek", nullable=False)
    chat_base_url: Mapped[str] = mapped_column(
        String(512), default="https://api.deepseek.com", nullable=False
    )
    chat_model: Mapped[str] = mapped_column(String(128), default="deepseek-v4-pro", nullable=False)
    chat_api_key_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    chat_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    embedding_provider: Mapped[str] = mapped_column(String(64), default="bailian", nullable=False)
    embedding_base_url: Mapped[str] = mapped_column(
        String(512),
        default="https://dashscope.aliyuncs.com/compatible-mode/v1",
        nullable=False,
    )
    embedding_model: Mapped[str] = mapped_column(
        String(128), default="text-embedding-v3", nullable=False
    )
    embedding_api_key_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
