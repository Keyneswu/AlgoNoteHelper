from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.retrieval import _load_context_notes
from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import AskChatMessage, AskChatSession
from app.schemas.ask_sessions import (
    AskChatMessageOut,
    AskChatSessionCreate,
    AskChatSessionListItem,
    AskChatSessionListOut,
    AskChatSessionOut,
    AskChatSessionUpdate,
    first_user_message_title,
    is_default_session_title,
)
from app.schemas.notes import PracticeNoteOut

router = APIRouter(prefix="/ask/sessions", tags=["ask-sessions"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _owned_context_note_ids(
    db: AsyncSession,
    *,
    user_id: str,
    note_ids: list[int],
) -> list[int]:
    notes = await _load_context_notes(db, user_id=user_id, note_ids=note_ids)
    return [n.id for n in notes]


async def _get_owned_session(
    db: AsyncSession,
    *,
    session_id: int,
    user_id: str,
    with_messages: bool = False,
) -> AskChatSession:
    stmt = select(AskChatSession).where(AskChatSession.id == session_id)
    if with_messages:
        stmt = stmt.options(selectinload(AskChatSession.messages))
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def _session_out(
    session: AskChatSession,
    context_notes: list,
) -> AskChatSessionOut:
    messages = sorted(session.messages, key=lambda m: (m.created_at, m.id))
    return AskChatSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        context_note_ids=list(session.context_note_ids or []),
        folder_id=session.folder_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[AskChatMessageOut.model_validate(m) for m in messages],
        context_notes=[PracticeNoteOut.model_validate(n) for n in context_notes],
    )


@router.get("", response_model=AskChatSessionListOut)
async def list_sessions(
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskChatSessionListOut:
    result = await db.execute(
        select(AskChatSession)
        .where(AskChatSession.user_id == user_id)
        .order_by(AskChatSession.updated_at.desc(), AskChatSession.id.desc())
    )
    items = list(result.scalars().all())
    return AskChatSessionListOut(
        items=[AskChatSessionListItem.model_validate(s) for s in items],
    )


@router.post("", response_model=AskChatSessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: AskChatSessionCreate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskChatSessionOut:
    title = (body.title or "").strip() or "New chat"
    context_note_ids = await _owned_context_note_ids(
        db, user_id=user_id, note_ids=body.context_note_ids
    )
    session = AskChatSession(
        user_id=user_id,
        title=title,
        context_note_ids=context_note_ids,
        folder_id=body.folder_id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    context_notes = await _load_context_notes(
        db, user_id=user_id, note_ids=session.context_note_ids or []
    )
    return AskChatSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        context_note_ids=list(session.context_note_ids or []),
        folder_id=session.folder_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[],
        context_notes=[PracticeNoteOut.model_validate(n) for n in context_notes],
    )


@router.get("/{session_id}", response_model=AskChatSessionOut)
async def get_session(
    session_id: int,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskChatSessionOut:
    session = await _get_owned_session(
        db, session_id=session_id, user_id=user_id, with_messages=True
    )
    context_notes = await _load_context_notes(
        db, user_id=user_id, note_ids=session.context_note_ids or []
    )
    return _session_out(session, context_notes)


@router.patch("/{session_id}", response_model=AskChatSessionOut)
async def update_session(
    session_id: int,
    body: AskChatSessionUpdate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskChatSessionOut:
    session = await _get_owned_session(
        db, session_id=session_id, user_id=user_id, with_messages=True
    )
    data = body.model_dump(exclude_unset=True)

    if "context_note_ids" in data and data["context_note_ids"] is not None:
        session.context_note_ids = await _owned_context_note_ids(
            db, user_id=user_id, note_ids=data["context_note_ids"]
        )

    if "folder_id" in data:
        session.folder_id = data["folder_id"]

    if "title" in data and data["title"] is not None:
        session.title = data["title"].strip() or session.title

    if "messages" in data and data["messages"] is not None:
        # Full transcript replace for v1.
        session.messages.clear()
        for msg in body.messages or []:
            session.messages.append(
                AskChatMessage(role=msg.role, content=msg.content)
            )

        if is_default_session_title(session.title):
            derived = first_user_message_title(body.messages or [])
            if derived:
                session.title = derived

    session.updated_at = _now()
    await db.commit()

    session = await _get_owned_session(
        db, session_id=session_id, user_id=user_id, with_messages=True
    )
    context_notes = await _load_context_notes(
        db, user_id=user_id, note_ids=session.context_note_ids or []
    )
    return _session_out(session, context_notes)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    session = await db.get(AskChatSession, session_id)
    if not session:
        # Idempotent: already gone.
        return
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    await db.delete(session)
    await db.commit()
