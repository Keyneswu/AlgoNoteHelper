from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PracticeNoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    statement: str = ""
    approach: str = ""
    code: str = ""
    pitfalls: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    # 1=low (green), 2=medium (yellow), 3=high (red)
    importance: int = Field(default=2, ge=1, le=3)
    review_dates: list[datetime] = Field(default_factory=list)
    source_meta: dict[str, Any] | None = None


class PracticeNoteCreate(PracticeNoteBase):
    pass


class PracticeNoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    statement: str | None = None
    approach: str | None = None
    code: str | None = None
    pitfalls: list[str] | None = None
    tags: list[str] | None = None
    importance: int | None = Field(default=None, ge=1, le=3)
    review_dates: list[datetime] | None = None
    source_meta: dict[str, Any] | None = None


class PracticeNoteOut(PracticeNoteBase):
    id: int
    user_id: str
    embedding_model: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteFilterQuery(BaseModel):
    q: str | None = None
    tags: list[str] | None = None
    importance: list[int] | None = None
    importance_min: int | None = Field(default=None, ge=1, le=3)
    importance_max: int | None = Field(default=None, ge=1, le=3)
    created_from: datetime | None = None
    created_to: datetime | None = None
    updated_from: datetime | None = None
    updated_to: datetime | None = None


class ImportExtractRequest(BaseModel):
    markdown: str = Field(min_length=1)


class ImportCandidate(PracticeNoteBase):
    pass


class ImportExtractResponse(BaseModel):
    candidates: list[ImportCandidate]


class ImportCommitRequest(BaseModel):
    candidates: list[ImportCandidate]


class LlmConfigUpdate(BaseModel):
    chat_provider: str | None = None
    chat_base_url: str | None = None
    chat_model: str | None = None
    chat_api_key: str | None = None
    embedding_provider: str | None = None
    embedding_base_url: str | None = None
    embedding_model: str | None = None
    embedding_api_key: str | None = None


class LlmConfigOut(BaseModel):
    chat_provider: str
    chat_base_url: str
    chat_model: str
    chat_api_key_hint: str | None
    chat_verified: bool
    embedding_provider: str
    embedding_base_url: str
    embedding_model: str
    embedding_api_key_hint: str | None
    embedding_verified: bool


class VerifyConnectionRequest(BaseModel):
    kind: str = Field(pattern="^(chat|embedding)$")
    # Optional override values for testing before save
    provider: str | None = None
    base_url: str | None = None
    model: str | None = None
    api_key: str | None = None


class VerifyConnectionResponse(BaseModel):
    ok: bool
    message: str


class RewriteRequest(BaseModel):
    field: str
    text: str


class RewriteResponse(BaseModel):
    rewritten: str


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    tags: list[str] | None = None
    importance: list[int] | None = None
    importance_min: int | None = Field(default=None, ge=1, le=3)
    top_k: int = Field(default=8, ge=1, le=20)


class AskResponse(BaseModel):
    notes: list[PracticeNoteOut]
    answer: str | None
