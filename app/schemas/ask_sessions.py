from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.notes import PracticeNoteOut

DEFAULT_SESSION_TITLES = frozenset(
    {
        "New chat",
        "新对话",
        # Existing Ask i18n labels (pre-sessions rename).
        "New session",
        "新会话",
    }
)
TITLE_MAX_LEN = 60
_WHITESPACE_RE = re.compile(r"\s+")


def is_default_session_title(title: str) -> bool:
    return title.strip() in DEFAULT_SESSION_TITLES


def title_from_first_user_message(content: str) -> str:
    """Trim, collapse whitespace, truncate to TITLE_MAX_LEN with ellipsis."""
    collapsed = _WHITESPACE_RE.sub(" ", content.strip())
    if not collapsed:
        return "New chat"
    if len(collapsed) <= TITLE_MAX_LEN:
        return collapsed
    return collapsed[:TITLE_MAX_LEN].rstrip() + "…"


def first_user_message_title(messages: list[AskChatMessageWrite] | list[AskChatMessageOut]) -> str | None:
    for msg in messages:
        if msg.role == "user" and msg.content.strip():
            return title_from_first_user_message(msg.content)
    return None


class AskChatMessageWrite(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1)


class AskChatMessageOut(BaseModel):
    id: int
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AskChatSessionListItem(BaseModel):
    id: int
    title: str
    updated_at: datetime
    created_at: datetime | None = None
    folder_id: int | None = None

    model_config = {"from_attributes": True}


class AskChatSessionListOut(BaseModel):
    items: list[AskChatSessionListItem]


class AskChatSessionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    context_note_ids: list[int] = Field(default_factory=list)
    folder_id: int | None = None


class AskChatSessionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    messages: list[AskChatMessageWrite] | None = None
    context_note_ids: list[int] | None = None
    folder_id: int | None = None


class AskChatSessionOut(BaseModel):
    id: int
    user_id: str
    title: str
    context_note_ids: list[int]
    folder_id: int | None = None
    created_at: datetime
    updated_at: datetime
    messages: list[AskChatMessageOut]
    context_notes: list[PracticeNoteOut]

    model_config = {"from_attributes": True}
