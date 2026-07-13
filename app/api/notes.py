from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, and_, func, literal_column, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt_secret
from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import PracticeNote
from app.schemas.notes import (
    FieldMergeRequest,
    FieldMergeResponse,
    ImportCandidate,
    ImportCommitRequest,
    ImportExtractRequest,
    ImportExtractResponse,
    MergeNoteRequest,
    PracticeNoteCreate,
    PracticeNoteListOut,
    PracticeNoteOut,
    PracticeNoteUpdate,
    SimilarMatch,
    SimilarRequest,
    SimilarResponse,
    SortMode,
    SortOrder,
)
from app.services.embeddings import embed_note_if_ready
from app.services.llm import (
    chat_completion,
    create_embedding,
    get_user_llm_config,
    parse_json_array,
    require_chat_config,
)
from app.services.notes_dedup import (
    SIMILAR_TOP_K,
    allocate_unique_title,
    build_similarity_embed_text,
    find_similar_notes,
)
from app.services.preset_tags import NOTES_PAGE_SIZE, PRESET_TAG_ORDER

router = APIRouter(prefix="/notes", tags=["notes"])

FIELD_MERGE_SYSTEM = """You merge two versions of the same algorithm practice note field into one.
Rules:
- Prefer preserving the INCOMING version's facts, wording, and structure when versions conflict.
- Keep useful details from EXISTING that incoming omits (edge cases, caveats), without inventing new facts.
- Preserve the language of the inputs (do not translate).
- Return ONLY the merged field text, no preamble or markdown fences unless the inputs used them."""


def _owner_query(user_id: str) -> Select[tuple[PracticeNote]]:
    return select(PracticeNote).where(PracticeNote.user_id == user_id)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _seed_review_dates(dates: list[datetime] | None) -> list[datetime]:
    if dates:
        return list(dates)
    return [_now()]


def _escape_ilike(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _learning_ordinal_expr():
    # Keep in sync with frontend PRESET_TAGS — ColumnClause supports .asc()/.nulls_last().
    values_sql = ", ".join(f"('{tag}', {idx})" for idx, tag in enumerate(PRESET_TAG_ORDER))
    return literal_column(
        f"(SELECT MIN(v.ord) FROM (VALUES {values_sql}) AS v(tag, ord) "
        f"WHERE v.tag = ANY(practice_notes.tags))"
    )


def _max_review_date_expr():
    return literal_column("(SELECT max(d) FROM unnest(practice_notes.review_dates) AS d)")


async def _create_owned_note(
    db: AsyncSession,
    *,
    user_id: str,
    data: dict,
) -> PracticeNote:
    payload = dict(data)
    payload["title"] = await allocate_unique_title(db, user_id, str(payload.get("title") or "Untitled"))
    payload["review_dates"] = _seed_review_dates(payload.get("review_dates"))
    note = PracticeNote(user_id=user_id, **payload)
    db.add(note)
    await db.flush()
    await embed_note_if_ready(db, note)
    return note


@router.get("", response_model=PracticeNoteListOut)
async def list_notes(
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
    q: str | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    difficulty: list[int] | None = Query(default=None),
    practiced_from: datetime | None = Query(default=None),
    practiced_to: datetime | None = Query(default=None),
    sort: SortMode = Query(default="learning"),
    order: SortOrder = Query(default="asc"),
    page: int = Query(default=1, ge=1),
) -> PracticeNoteListOut:
    filters = [PracticeNote.user_id == user_id]
    title_q = (q or "").strip()
    if title_q:
        filters.append(PracticeNote.title.ilike(f"%{_escape_ilike(title_q)}%", escape="\\"))
    if tags:
        normalized = [tag.strip().lower() for tag in tags if tag.strip()]
        if normalized:
            filters.append(PracticeNote.tags.contains(normalized))
    if difficulty:
        levels = [level for level in difficulty if 1 <= level <= 3]
        if levels:
            filters.append(PracticeNote.difficulty.in_(levels))
    if practiced_from is not None or practiced_to is not None:
        range_clauses = ["EXISTS (SELECT 1 FROM unnest(practice_notes.review_dates) AS d WHERE TRUE"]
        bind: dict[str, datetime] = {}
        if practiced_from is not None:
            range_clauses.append("AND d >= :practiced_from")
            bind["practiced_from"] = practiced_from
        if practiced_to is not None:
            range_clauses.append("AND d <= :practiced_to")
            bind["practiced_to"] = practiced_to
        range_clauses.append(")")
        filters.append(text(" ".join(range_clauses)).bindparams(**bind))

    where = and_(*filters)
    total = int(
        (await db.execute(select(func.count()).select_from(PracticeNote).where(where))).scalar_one()
    )

    stmt = select(PracticeNote).where(where)
    if sort == "difficulty":
        diff_order = (
            PracticeNote.difficulty.asc() if order == "asc" else PracticeNote.difficulty.desc()
        )
        stmt = stmt.order_by(diff_order, PracticeNote.title.asc(), PracticeNote.id.asc())
    elif sort == "practiced":
        stmt = stmt.order_by(
            _max_review_date_expr().desc().nulls_last(),
            PracticeNote.title.asc(),
            PracticeNote.id.asc(),
        )
    else:
        stmt = stmt.order_by(
            _learning_ordinal_expr().asc().nulls_last(),
            PracticeNote.title.asc(),
            PracticeNote.id.asc(),
        )

    offset = (page - 1) * NOTES_PAGE_SIZE
    stmt = stmt.offset(offset).limit(NOTES_PAGE_SIZE)
    result = await db.execute(stmt)
    items = list(result.scalars().all())
    return PracticeNoteListOut(
        items=items,
        total=total,
        page=page,
        page_size=NOTES_PAGE_SIZE,
    )


@router.post("/similar", response_model=SimilarResponse)
async def similar_notes(
    body: SimilarRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> SimilarResponse:
    cfg = await get_user_llm_config(db, user_id)
    if not cfg or not cfg.embedding_api_key_enc or not cfg.embedding_verified:
        return SimilarResponse(matches=[])
    try:
        api_key = decrypt_secret(cfg.embedding_api_key_enc)
        query_vec = await create_embedding(
            base_url=cfg.embedding_base_url,
            api_key=api_key,
            model=cfg.embedding_model,
            text=build_similarity_embed_text(title=body.title, statement=body.statement),
        )
        rows = await find_similar_notes(
            db,
            user_id=user_id,
            query_vec=query_vec,
            top_k=min(body.top_k, SIMILAR_TOP_K) if body.top_k else SIMILAR_TOP_K,
        )
    except Exception:  # noqa: BLE001 — soft-fail: never block create/import
        return SimilarResponse(matches=[])
    return SimilarResponse(
        matches=[
            SimilarMatch(note=PracticeNoteOut.model_validate(note), score=score)
            for note, score in rows
        ]
    )


@router.post("/ai-merge", response_model=FieldMergeResponse)
async def ai_merge_field(
    body: FieldMergeRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> FieldMergeResponse:
    cfg, api_key = await require_chat_config(db, user_id)
    merged = await chat_completion(
        base_url=cfg.chat_base_url,
        api_key=api_key,
        model=cfg.chat_model,
        messages=[
            {"role": "system", "content": FIELD_MERGE_SYSTEM},
            {
                "role": "user",
                "content": (
                    f"Field: {body.field}\n\n"
                    f"EXISTING:\n{body.existing}\n\n"
                    f"INCOMING:\n{body.incoming}"
                ),
            },
        ],
        temperature=0.2,
    )
    return FieldMergeResponse(merged=merged.strip())


@router.post("", response_model=PracticeNoteOut, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: PracticeNoteCreate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> PracticeNote:
    note = await _create_owned_note(db, user_id=user_id, data=body.model_dump())
    await db.commit()
    await db.refresh(note)
    return note


@router.post("/reembed-all", response_model=dict[str, int])
async def reembed_all_notes(
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Refresh embeddings for all of the caller's notes (e.g. after embed text composition changes)."""
    result = await db.execute(_owner_query(user_id))
    notes = list(result.scalars().all())
    updated = 0
    for note in notes:
        await embed_note_if_ready(db, note)
        if note.embedding is not None:
            updated += 1
    await db.commit()
    return {"total": len(notes), "updated": updated}


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
    if "title" in data and data["title"] is not None and data["title"] != note.title:
        data["title"] = await allocate_unique_title(
            db, user_id, str(data["title"]), exclude_note_id=note_id
        )
    for key, value in data.items():
        setattr(note, key, value)
    await embed_note_if_ready(db, note)
    await db.commit()
    await db.refresh(note)
    return note


@router.post("/{note_id}/merge", response_model=PracticeNoteOut)
async def merge_note(
    note_id: int,
    body: MergeNoteRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> PracticeNote:
    note = await db.get(PracticeNote, note_id)
    if not note or note.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    title = body.title.strip() or note.title
    if title != note.title:
        # Allow keeping the existing title; only uniquify if changing to a colliding title.
        clash = await db.execute(
            select(PracticeNote.id).where(
                PracticeNote.user_id == user_id,
                PracticeNote.title == title,
                PracticeNote.id != note_id,
            )
        )
        if clash.scalar_one_or_none() is not None:
            title = await allocate_unique_title(
                db, user_id, title, exclude_note_id=note_id
            )

    note.title = title
    note.statement = body.statement
    note.approach = body.approach
    note.code = body.code
    note.pitfalls = list(body.pitfalls)
    note.tags = list(body.tags)
    note.difficulty = body.difficulty
    dates = list(note.review_dates or [])
    dates.append(_now())
    note.review_dates = dates
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
difficulty (integer 1-3 where 1=easy, 2=medium, 3=hard).

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
                difficulty=max(
                    1,
                    min(
                        3,
                        int(item.get("difficulty") or item.get("importance") or 2),
                    ),
                ),
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
        note = await _create_owned_note(db, user_id=user_id, data=candidate.model_dump())
        created.append(note)
    await db.commit()
    for note in created:
        await db.refresh(note)
    return created
