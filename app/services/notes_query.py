from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import PracticeNote


async def get_owned_note(db: AsyncSession, note_id: int, user_id: str) -> PracticeNote:
    note = await db.get(PracticeNote, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


def append_tag_difficulty_filters(
    filters: list[Any],
    *,
    tags: list[str] | None,
    difficulty: list[int] | None,
) -> list[Any]:
    """Append tags.contains / difficulty.in_ filters (no user_id or embedding)."""
    if tags:
        normalized = [tag.strip().lower() for tag in tags if tag.strip()]
        if normalized:
            filters.append(PracticeNote.tags.contains(normalized))
    if difficulty:
        levels = [level for level in difficulty if 1 <= level <= 3]
        if levels:
            filters.append(PracticeNote.difficulty.in_(levels))
    return filters


async def load_context_notes(
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
