from __future__ import annotations

import re

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import PracticeNote

# Cosine similarity = 1 - (<=> distance). Keep matches at or above this score.
SIMILARITY_THRESHOLD = 0.72
SIMILAR_TOP_K = 3

_SUFFIX_RE = re.compile(r"^(?P<base>.*?)(?: \((?P<n>\d+)\))?$")


def build_similarity_embed_text(*, title: str, statement: str) -> str:
    return f"Title: {title.strip()}\n\nStatement:\n{(statement or '').strip()}".strip()


async def allocate_unique_title(
    db: AsyncSession,
    user_id: str,
    title: str,
    *,
    exclude_note_id: int | None = None,
) -> str:
    base = (title or "").strip() or "Untitled"
    # Cap so " (N)" still fits String(512)
    if len(base) > 500:
        base = base[:500].rstrip()

    base_filters = [
        PracticeNote.user_id == user_id,
        PracticeNote.title == base,
    ]
    if exclude_note_id is not None:
        base_filters.append(PracticeNote.id != exclude_note_id)

    result = await db.execute(select(PracticeNote.title).where(*base_filters))
    if result.scalar_one_or_none() is None:
        return base

    existing = await db.execute(
        select(PracticeNote.title).where(
            PracticeNote.user_id == user_id,
            PracticeNote.title.like(f"{base} (%"),
        )
    )
    used_nums: set[int] = set()
    for row_title in existing.scalars().all():
        match = _SUFFIX_RE.match(row_title or "")
        if not match:
            continue
        if match.group("base") != base:
            continue
        n = match.group("n")
        if n is not None:
            used_nums.add(int(n))

    n = 2
    while n <= 10_000:
        if n in used_nums:
            n += 1
            continue
        candidate = f"{base} ({n})"
        clash_filters = [
            PracticeNote.user_id == user_id,
            PracticeNote.title == candidate,
        ]
        if exclude_note_id is not None:
            clash_filters.append(PracticeNote.id != exclude_note_id)
        clash = await db.execute(select(PracticeNote.id).where(*clash_filters))
        if clash.scalar_one_or_none() is None:
            return candidate
        n += 1
    return f"{base} ({n})"


async def find_similar_notes(
    db: AsyncSession,
    *,
    user_id: str,
    query_vec: list[float],
    top_k: int = SIMILAR_TOP_K,
    threshold: float = SIMILARITY_THRESHOLD,
) -> list[tuple[PracticeNote, float]]:
    max_distance = 1.0 - threshold
    vec_literal = "[" + ",".join(str(float(x)) for x in query_vec) + "]"
    stmt = (
        select(
            PracticeNote,
            text(f"1 - (embedding <=> '{vec_literal}'::vector) AS score"),
        )
        .where(
            PracticeNote.user_id == user_id,
            PracticeNote.embedding.is_not(None),
            text(f"(embedding <=> '{vec_literal}'::vector) <= {max_distance}"),
        )
        .order_by(text(f"embedding <=> '{vec_literal}'::vector"))
        .limit(top_k)
    )
    result = await db.execute(stmt)
    rows: list[tuple[PracticeNote, float]] = []
    for note, score in result.all():
        rows.append((note, float(score)))
    return rows
