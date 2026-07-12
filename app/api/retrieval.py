from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import PracticeNote
from app.schemas.notes import AskRequest, AskResponse, PracticeNoteOut
from app.services.embeddings import build_embed_text
from app.services.llm import chat_completion, create_embedding, require_chat_config, require_embedding_config

router = APIRouter(prefix="/ask", tags=["ask"])

ANSWER_SYSTEM = """You answer using ONLY the practice notes provided below.
If the notes do not contain enough information, say so.
Do NOT invent external LeetCode knowledge as if it were the user's notes.
List grounding: only use the notes in the provided list."""


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

    # Metadata pre-filter + cosine distance via pgvector
    filters = [PracticeNote.user_id == user_id, PracticeNote.embedding.is_not(None)]
    if body.tags:
        filters.append(PracticeNote.tags.overlap(body.tags))
    if body.importance_min is not None:
        filters.append(PracticeNote.importance >= body.importance_min)

    # Use raw distance operator; bind vector as string literal for asyncpg
    vec_literal = "[" + ",".join(str(float(x)) for x in query_vec) + "]"
    stmt = (
        select(PracticeNote)
        .where(and_(*filters))
        .order_by(text(f"embedding <=> '{vec_literal}'::vector"))
        .limit(body.top_k)
    )
    result = await db.execute(stmt)
    notes = list(result.scalars().all())

    if not notes:
        return AskResponse(
            notes=[],
            answer="No relevant notes were found for your question.",
        )

    notes_out = [PracticeNoteOut.model_validate(n) for n in notes]
    context_blocks = []
    for i, note in enumerate(notes, start=1):
        context_blocks.append(f"### Note {i} (id={note.id})\n{build_embed_text(note)}")
    context = "\n\n".join(context_blocks)

    answer = await chat_completion(
        base_url=chat_cfg.chat_base_url,
        api_key=chat_key,
        model=chat_cfg.chat_model,
        messages=[
            {"role": "system", "content": ANSWER_SYSTEM},
            {
                "role": "user",
                "content": f"Question: {body.question}\n\nRetrieved notes:\n{context}",
            },
        ],
    )
    return AskResponse(notes=notes_out, answer=answer.strip())
