from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import PracticeNote
from app.services.llm import create_embedding, get_user_llm_config, require_embedding_config


def build_embed_text(note: PracticeNote) -> str:
    pitfalls = "\n".join(f"- {p}" for p in (note.pitfalls or []))
    parts = [
        f"Title: {note.title}",
        f"Statement:\n{note.statement or ''}",
        f"Approach:\n{note.approach or ''}",
        f"Pitfalls:\n{pitfalls}",
    ]
    return "\n\n".join(parts).strip()


async def embed_note_if_ready(db: AsyncSession, note: PracticeNote) -> None:
    cfg = await get_user_llm_config(db, note.user_id)
    if not cfg or not cfg.embedding_api_key_enc or not cfg.embedding_verified:
        return
    _, api_key = await require_embedding_config(db, note.user_id)
    vector = await create_embedding(
        base_url=cfg.embedding_base_url,
        api_key=api_key,
        model=cfg.embedding_model,
        text=build_embed_text(note),
    )
    note.embedding = vector
    note.embedding_model = cfg.embedding_model
