from datetime import datetime
from typing import Annotated, Any, Literal, Self

from pydantic import BaseModel, Field, model_validator


class PracticeNoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    statement: str = ""
    approach: str = ""
    code: str = ""
    pitfalls: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    # 1=easy (green), 2=medium (yellow), 3=hard (red)
    difficulty: int = Field(default=2, ge=1, le=3)
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
    difficulty: int | None = Field(default=None, ge=1, le=3)
    review_dates: list[datetime] | None = None
    source_meta: dict[str, Any] | None = None


class PracticeNoteOut(PracticeNoteBase):
    id: int
    user_id: str
    embedding_model: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PracticeNoteListOut(BaseModel):
    items: list[PracticeNoteOut]
    total: int
    page: int
    page_size: int


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


RewriteField = Literal["statement", "approach", "pitfall"]
RewriteOperation = Literal[
    "format_markdown",
    "organize",
    "clarify",
    "shorten",
    "custom",
]


class RewriteContext(BaseModel):
    title: str = Field(default="", max_length=512)
    statement: str = Field(default="", max_length=50_000)
    approach: str = Field(default="", max_length=50_000)
    tags: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        default_factory=list,
        max_length=100,
    )
    code: str = Field(default="", max_length=100_000)


class RewriteRequest(BaseModel):
    field: RewriteField
    operation: RewriteOperation
    text: str = Field(min_length=1, max_length=50_000)
    instruction: str | None = Field(default=None, max_length=2_000)
    context: RewriteContext = Field(default_factory=RewriteContext)

    @model_validator(mode="after")
    def validate_operation(self) -> Self:
        if not self.text.strip():
            raise ValueError("Rewrite target must not be blank")
        allowed: dict[RewriteField, set[RewriteOperation]] = {
            "statement": {"format_markdown", "custom"},
            "approach": {"organize", "custom"},
            "pitfall": {"clarify", "shorten", "custom"},
        }
        if self.operation not in allowed[self.field]:
            raise ValueError(
                f"Operation '{self.operation}' is not supported for field '{self.field}'"
            )
        if self.operation == "custom" and not (self.instruction or "").strip():
            raise ValueError("Custom rewrite requires an instruction")
        return self


class RewriteResponse(BaseModel):
    rewritten: str


class GenerateApproachRequest(BaseModel):
    title: str = ""
    statement: str = ""
    tags: list[str] = Field(default_factory=list)
    code: str = ""


class AskChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1)


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    tags: list[str] | None = None
    difficulty: list[int] | None = None
    top_k: int = Field(default=8, ge=1, le=20)
    # Prior turns in the same session (excluding the current question).
    messages: list[AskChatMessage] = Field(default_factory=list)
    # Note ids currently in the client Context Bar (owned by caller).
    context_note_ids: list[int] = Field(default_factory=list)


class AskResponse(BaseModel):
    notes: list[PracticeNoteOut]
    notes_added: list[PracticeNoteOut] = Field(default_factory=list)
    answer: str | None


class SimilarRequest(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    statement: str = ""
    top_k: int = Field(default=3, ge=1, le=10)


class SimilarMatch(BaseModel):
    note: PracticeNoteOut
    score: float


class SimilarResponse(BaseModel):
    matches: list[SimilarMatch]


class MergeNoteRequest(BaseModel):
    """Field values from the resolve canvas to write onto an existing note."""

    title: str = Field(min_length=1, max_length=512)
    statement: str = ""
    approach: str = ""
    code: str = ""
    pitfalls: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    difficulty: int = Field(default=2, ge=1, le=3)


class FieldMergeRequest(BaseModel):
    field: str = Field(min_length=1, max_length=64)
    existing: str = ""
    incoming: str = ""


class FieldMergeResponse(BaseModel):
    merged: str


SortMode = Literal["learning", "difficulty", "practiced"]
SortOrder = Literal["asc", "desc"]
