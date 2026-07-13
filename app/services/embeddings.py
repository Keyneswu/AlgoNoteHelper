from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import PracticeNote
from app.services.llm import create_embedding, get_user_llm_config, require_embedding_config

# Embedding providers often cap input length; keep retrieval docs bounded.
_EMBED_CODE_MAX_CHARS = 6000


def build_note_context(
    note: PracticeNote,
    *,
    include_code: bool = True,
    code_max_chars: int | None = None,
) -> str:
    """Serialize a note for embedding and/or Ask answer grounding."""
    pitfalls = "\n".join(f"- {p}" for p in (note.pitfalls or []))
    parts = [
        f"Title: {note.title}",
        f"Statement:\n{note.statement or ''}",
        f"Approach:\n{note.approach or ''}",
        f"Pitfalls:\n{pitfalls}",
    ]
    if include_code:
        code = (note.code or "").strip()
        if code:
            if code_max_chars is not None and len(code) > code_max_chars:
                code = code[:code_max_chars].rstrip() + "\n…(truncated)"
            parts.append(f"Code:\n{code}")
    return "\n\n".join(parts).strip()


def build_embed_text(note: PracticeNote) -> str:
    """Text used for the note's vector; includes code (truncated) for code-aware recall."""
    return build_note_context(
        note,
        include_code=True,
        code_max_chars=_EMBED_CODE_MAX_CHARS,
    )


def build_answer_context(note: PracticeNote) -> str:
    """Full note text injected into Ask prompts, including complete code when present."""
    return build_note_context(note, include_code=True, code_max_chars=None)


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
