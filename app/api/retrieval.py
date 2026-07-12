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
from app.services.embeddings import build_embed_text
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
    if body.importance:
        levels = [level for level in body.importance if 1 <= level <= 3]
        if levels:
            filters.append(PracticeNote.importance.in_(levels))
    elif body.importance_min is not None:
        filters.append(PracticeNote.importance >= body.importance_min)
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


def _notes_out(notes: list[PracticeNote]) -> list[PracticeNoteOut]:
    return [PracticeNoteOut.model_validate(n) for n in notes]


def _ask_messages(question: str, notes: list[PracticeNote]) -> list[dict[str, str]]:
    context_blocks = []
    for i, note in enumerate(notes, start=1):
        context_blocks.append(f"### Note {i} (id={note.id})\n{build_embed_text(note)}")
    context = "\n\n".join(context_blocks)
    return [
        {"role": "system", "content": ANSWER_SYSTEM},
        {
            "role": "user",
            "content": f"Question: {question}\n\nRetrieved notes:\n{context}",
        },
    ]


@router.post("", response_model=AskResponse)
async def ask(
    body: AskRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AskResponse:
    emb_cfg, emb_key = await require_embedding_config(db, user_id)
    chat_cfg, chat_key = await require_chat_config(db, user_id)

    query_vec = await create_embedding(
        base_url=emb_cfg.embedding_base_url,
        api_key=emb_key,
        model=emb_cfg.embedding_model,
        text=body.question,
    )
    notes = await _retrieve_notes(db, user_id=user_id, body=body, query_vec=query_vec)
    notes_out = _notes_out(notes)

    if not notes:
        return AskResponse(notes=[], answer=EMPTY_NOTES_ANSWER)

    answer = await chat_completion(
        base_url=chat_cfg.chat_base_url,
        api_key=chat_key,
        model=chat_cfg.chat_model,
        messages=_ask_messages(body.question, notes),
    )
    return AskResponse(notes=notes_out, answer=answer.strip())


@router.post("/stream", response_class=EventSourceResponse)
async def ask_stream(
    body: AskRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> AsyncIterator[ServerSentEvent]:
    """SSE stream: ``notes`` → ``token``* → ``done`` (or ``error``).

    Must yield from the path operation with ``response_class=EventSourceResponse``
    so FastAPI encodes ``ServerSentEvent`` (do not ``return EventSourceResponse(...)``).
    Docs: https://fastapi.tiangolo.com/tutorial/server-sent-events/
    Frontend: ``frontend/src/lib/ask-sse.ts``.
    """
    emb_cfg, emb_key = await require_embedding_config(db, user_id)
    chat_cfg, chat_key = await require_chat_config(db, user_id)

    query_vec = await create_embedding(
        base_url=emb_cfg.embedding_base_url,
        api_key=emb_key,
        model=emb_cfg.embedding_model,
        text=body.question,
    )
    notes = await _retrieve_notes(db, user_id=user_id, body=body, query_vec=query_vec)
    notes_payload = [n.model_dump(mode="json") for n in _notes_out(notes)]

    # Capture values before streaming so we do not touch the DB session mid-stream.
    chat_base_url = chat_cfg.chat_base_url
    chat_model = chat_cfg.chat_model
    messages = _ask_messages(body.question, notes) if notes else None

    yield ServerSentEvent(data=notes_payload, event="notes")
    if not notes or messages is None:
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
