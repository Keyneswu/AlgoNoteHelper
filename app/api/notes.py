from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import PracticeNote
from app.schemas.notes import (
    ImportCandidate,
    ImportCommitRequest,
    ImportExtractRequest,
    ImportExtractResponse,
    PracticeNoteCreate,
    PracticeNoteOut,
    PracticeNoteUpdate,
)
from app.services.embeddings import embed_note_if_ready
from app.services.llm import chat_completion, parse_json_array, require_chat_config

router = APIRouter(prefix="/notes", tags=["notes"])


def _owner_query(user_id: str) -> Select[tuple[PracticeNote]]:
    return select(PracticeNote).where(PracticeNote.user_id == user_id)


@router.get("", response_model=list[PracticeNoteOut])
async def list_notes(
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
    tags: list[str] | None = Query(default=None),
    importance_min: int | None = Query(default=None, ge=1, le=3),
    importance_max: int | None = Query(default=None, ge=1, le=3),
    created_from: str | None = None,
    created_to: str | None = None,
    updated_from: str | None = None,
    updated_to: str | None = None,
) -> list[PracticeNote]:
    stmt = _owner_query(user_id).order_by(PracticeNote.updated_at.desc())
    filters = []
    if tags:
        filters.append(PracticeNote.tags.overlap(tags))
    if importance_min is not None:
        filters.append(PracticeNote.importance >= importance_min)
    if importance_max is not None:
        filters.append(PracticeNote.importance <= importance_max)
    if created_from:
        filters.append(PracticeNote.created_at >= created_from)
    if created_to:
        filters.append(PracticeNote.created_at <= created_to)
    if updated_from:
        filters.append(PracticeNote.updated_at >= updated_from)
    if updated_to:
        filters.append(PracticeNote.updated_at <= updated_to)
    if filters:
        stmt = stmt.where(and_(*filters))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=PracticeNoteOut, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: PracticeNoteCreate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> PracticeNote:
    note = PracticeNote(user_id=user_id, **body.model_dump())
    db.add(note)
    await db.flush()
    await embed_note_if_ready(db, note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/{note_id}", response_model=PracticeNoteOut)
async def get_note(
    note_id: int,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> PracticeNote:
    note = await db.get(PracticeNote, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=PracticeNoteOut)
async def update_note(
    note_id: int,
    body: PracticeNoteUpdate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> PracticeNote:
    note = await db.get(PracticeNote, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(note, key, value)
    await embed_note_if_ready(db, note)
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    note = await db.get(PracticeNote, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    await db.delete(note)
    await db.commit()


IMPORT_SYSTEM = """You extract algorithm practice notes from Markdown.

Return ONLY valid JSON: an array of objects with keys:
title (string), statement (string), approach (string), code (string),
pitfalls (string array), tags (string array),
importance (integer 1-3 where 1=low, 2=medium, 3=high).

Language rules (critical):
- Preserve the source language exactly. If the Markdown is Chinese, keep Chinese
  in title, statement, approach, and pitfalls. Do NOT translate into English
  (or any other language).
- Copy wording faithfully from the Markdown; you may lightly clean formatting,
  but do not rewrite meaning or paraphrase into another language.
- Code blocks stay as written (identifiers/comments unchanged).
- Tags may stay lowercase English topic labels when the source already uses them
  (e.g. "dp", "array"); do not translate prose fields into tag English.

Sparse/empty fields are allowed. Do not invent problems that are not in the Markdown.
If nothing can be extracted, return []."""


@router.post("/import/extract", response_model=ImportExtractResponse)
async def import_extract(
    body: ImportExtractRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> ImportExtractResponse:
    cfg, api_key = await require_chat_config(db, user_id)
    content = await chat_completion(
        base_url=cfg.chat_base_url,
        api_key=api_key,
        model=cfg.chat_model,
        messages=[
            {"role": "system", "content": IMPORT_SYSTEM},
            {"role": "user", "content": body.markdown},
        ],
    )
    try:
        raw = parse_json_array(content)
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Model did not return valid JSON candidates",
        ) from exc

    candidates: list[ImportCandidate] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "Untitled").strip() or "Untitled"
        candidates.append(
            ImportCandidate(
                title=title,
                statement=str(item.get("statement") or ""),
                approach=str(item.get("approach") or ""),
                code=str(item.get("code") or ""),
                pitfalls=[str(p) for p in (item.get("pitfalls") or [])],
                tags=[str(t) for t in (item.get("tags") or [])],
                importance=max(1, min(3, int(item.get("importance") or 2))),
                source_meta={"imported": True},
            )
        )
    return ImportExtractResponse(candidates=candidates)


@router.post("/import/commit", response_model=list[PracticeNoteOut])
async def import_commit(
    body: ImportCommitRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> list[PracticeNote]:
    created: list[PracticeNote] = []
    for candidate in body.candidates:
        note = PracticeNote(user_id=user_id, **candidate.model_dump())
        db.add(note)
        await db.flush()
        await embed_note_if_ready(db, note)
        created.append(note)
    await db.commit()
    for note in created:
        await db.refresh(note)
    return created
