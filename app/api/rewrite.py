from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_bridged_user
from app.db.session import get_db
from app.schemas.notes import RewriteRequest, RewriteResponse
from app.services.llm import chat_completion, require_chat_config

router = APIRouter(prefix="/rewrite", tags=["rewrite"])

REWRITE_SYSTEM = """You clean formatting of algorithm practice note fields.
Rules:
- Fix whitespace, headings, lists, and remove irrelevant UI chrome.
- Do NOT change problem meaning.
- Do NOT add constraints, numbers, or requirements that were not in the input.
- Do NOT invent details.
- Return only the cleaned text, no preamble."""


@router.post("", response_model=RewriteResponse)
async def rewrite_field(
    body: RewriteRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> RewriteResponse:
    cfg, api_key = await require_chat_config(db, user_id)
    rewritten = await chat_completion(
        base_url=cfg.chat_base_url,
        api_key=api_key,
        model=cfg.chat_model,
        messages=[
            {"role": "system", "content": REWRITE_SYSTEM},
            {
                "role": "user",
                "content": f"Field: {body.field}\n\nText:\n{body.text}",
            },
        ],
        temperature=0.1,
    )
    return RewriteResponse(rewritten=rewritten.strip())
