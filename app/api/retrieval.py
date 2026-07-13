from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.sse import EventSourceResponse, ServerSentEvent
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import PracticeNote
from app.schemas.notes import AskRequest, AskResponse, PracticeNoteOut
from app.services.embeddings import build_answer_context
from app.services.llm import (
    chat_completion,
    chat_completion_stream,
    create_embedding,
    require_chat_config,
    require_embedding_config,
)

router = APIRouter(prefix="/ask", tags=["ask"])

ANSWER_SYSTEM = """You answer using ONLY the practice notes provided below.
If the notes do not contain enough information, say so.
Do NOT invent external LeetCode knowledge as if it were the user's notes.
List grounding: only use the notes in the provided list."""

EMPTY_NOTES_ANSWER = "No relevant notes were found for your question."


def _apply_ask_filters(filters: list[Any], body: AskRequest, user_id: str) -> list[Any]:
    filters = [PracticeNote.user_id == user_id, PracticeNote.embedding.is_not(None), *filters]
    if body.tags:
        normalized = [tag.strip().lower() for tag in body.tags if tag.strip()]
        if normalized:
            filters.append(PracticeNote.tags.contains(normalized))
    if body.difficulty:
        levels = [level for level in body.difficulty if 1 <= level <= 3]
        if levels:
            filters.append(PracticeNote.difficulty.in_(levels))
    return filters


async def _retrieve_notes(
    db: AsyncSession,
    *,
    user_id: str,
    body: AskRequest,
    query_vec: list[float],
) -> list[PracticeNote]:
    filters = _apply_ask_filters([], body, user_id)
    vec_literal = "[" + ",".join(str(float(x)) for x in query_vec) + "]"
    stmt = (
        select(PracticeNote)
        .where(and_(*filters))
        .order_by(text(f"embedding <=> '{vec_literal}'::vector"))
        .limit(body.top_k)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _load_context_notes(
    db: AsyncSession,
    *,
    user_id: str,
    note_ids: list[int],
) -> list[PracticeNote]:
    """Load owned notes for Context Bar ids; ignore missing / non-owned ids."""
    if not note_ids:
        return []
    # Preserve client order when possible.
    unique_ids = list(dict.fromkeys(note_ids))
    result = await db.execute(
        select(PracticeNote).where(
            PracticeNote.user_id == user_id,
            PracticeNote.id.in_(unique_ids),
        )
    )
    by_id = {n.id: n for n in result.scalars().all()}
    return [by_id[i] for i in unique_ids if i in by_id]


def _notes_out(notes: list[PracticeNote]) -> list[PracticeNoteOut]:
    return [PracticeNoteOut.model_validate(n) for n in notes]


def _merge_notes(
    context: list[PracticeNote],
    retrieved: list[PracticeNote],
) -> tuple[list[PracticeNote], list[PracticeNote]]:
    """Return (effective pool, notes_added) with id-based merge."""
    by_id: dict[int, PracticeNote] = {n.id: n for n in context}
    added: list[PracticeNote] = []
    for note in retrieved:
        if note.id not in by_id:
            by_id[note.id] = note
            added.append(note)
    # Stable order: context first, then newly added in retrieval order.
    effective = list(context) + added
    return effective, added


def _ask_messages(
    question: str,
    notes: list[PracticeNote],
    history: list[dict[str, str]] | None = None,
) -> list[dict[str, str]]:
    context_blocks = []
    for i, note in enumerate(notes, start=1):
        context_blocks.append(f"### Note {i} (id={note.id})\n{build_answer_context(note)}")
    context = "\n\n".join(context_blocks)
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": (
                f"{ANSWER_SYSTEM}\n\nRetrieved notes (grounding set):\n{context}"
            ),
        },
    ]
    for turn in history or []:
        role = turn.get("role")
        content = (turn.get("content") or "").strip()
        if role in ("user", "assistant", "system") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": question})
    return messages


def _history_dicts(body: AskRequest) -> list[dict[str, str]]:
    return [{"role": m.role, "content": m.content} for m in body.messages]


async def _prepare_ask_turn(
    db: AsyncSession,
    *,
    user_id: str,
    body: AskRequest,
) -> tuple[list[PracticeNote], list[PracticeNote], list[dict[str, str]] | None]:
    """Retrieve, merge context, build LLM messages. Returns (effective, added, messages|None)."""
    emb_cfg, emb_key = await require_embedding_config(db, user_id)
    query_vec = await create_embedding(
        base_url=emb_cfg.embedding_base_url,
        api_key=emb_key,
        model=emb_cfg.embedding_model,
        text=body.question,
    )
    context_notes = await _load_context_notes(
        db, user_id=user_id, note_ids=body.context_note_ids
    )
    retrieved = await _retrieve_notes(db, user_id=user_id, body=body, query_vec=query_vec)
    effective, added = _merge_notes(context_notes, retrieved)
    if not effective:
        return [], added, None
    messages = _ask_messages(body.question, effective, _history_dicts(body))
    return effective, added, messages


@router.post("", response_model=AskResponse)
async def ask(
    body: AskRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskResponse:
    chat_cfg, chat_key = await require_chat_config(db, user_id)
    effective, added, messages = await _prepare_ask_turn(db, user_id=user_id, body=body)
    notes_out = _notes_out(effective)
    added_out = _notes_out(added)

    if not effective or messages is None:
        return AskResponse(notes=[], notes_added=added_out, answer=EMPTY_NOTES_ANSWER)

    answer = await chat_completion(
        base_url=chat_cfg.chat_base_url,
        api_key=chat_key,
        model=chat_cfg.chat_model,
        messages=messages,
    )
    return AskResponse(notes=notes_out, notes_added=added_out, answer=answer.strip())


@router.post("/stream", response_class=EventSourceResponse)
async def ask_stream(
    body: AskRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AsyncIterator[ServerSentEvent]:
    """SSE stream: ``notes_added`` → ``token``* → ``done`` (or ``error``).

    Must yield from the path operation with ``response_class=EventSourceResponse``
    so FastAPI encodes ``ServerSentEvent`` (do not ``return EventSourceResponse(...)``).
    Docs: https://fastapi.tiangolo.com/tutorial/server-sent-events/
    Frontend: ``frontend/src/lib/ask-sse.ts``.
    """
    chat_cfg, chat_key = await require_chat_config(db, user_id)
    effective, added, messages = await _prepare_ask_turn(db, user_id=user_id, body=body)
    added_payload = [n.model_dump(mode="json") for n in _notes_out(added)]

    # Capture values before streaming so we do not touch the DB session mid-stream.
    chat_base_url = chat_cfg.chat_base_url
    chat_model = chat_cfg.chat_model

    yield ServerSentEvent(data=added_payload, event="notes_added")
    if not effective or messages is None:
        yield ServerSentEvent(data=EMPTY_NOTES_ANSWER, event="token")
        yield ServerSentEvent(data={}, event="done")
        return
    try:
        async for token in chat_completion_stream(
            base_url=chat_base_url,
            api_key=chat_key,
            model=chat_model,
            messages=messages,
        ):
            if token:
                yield ServerSentEvent(data=token, event="token")
        yield ServerSentEvent(data={}, event="done")
    except HTTPException as exc:
        detail = exc.detail
        message = detail if isinstance(detail, str) else str(detail)
        yield ServerSentEvent(data={"message": message}, event="error")
    except Exception as exc:  # noqa: BLE001 — surface to client as SSE error
        yield ServerSentEvent(data={"message": str(exc) or "Stream failed"}, event="error")
