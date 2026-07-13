from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_bridged_user
from app.db.session import get_db
from app.schemas.notes import (
    GenerateApproachRequest,
    RewriteRequest,
    RewriteResponse,
)
from app.services.llm import chat_completion, require_chat_config

router = APIRouter(prefix="/rewrite", tags=["rewrite"])

# Heuristic: shorter than this is treated as an incomplete problem statement.
MIN_STATEMENT_CHARS = 40

REWRITE_SYSTEM = """You clean formatting of algorithm practice note fields.
Rules:
- Fix whitespace, headings, lists, and remove irrelevant UI chrome.
- Do NOT change problem meaning.
- Do NOT add constraints, numbers, or requirements that were not in the input.
- Do NOT invent details.
- Return only the cleaned text, no preamble."""

GENERATE_APPROACH_SYSTEM = """You write a clear, structured solution approach for an algorithm practice note.

Rules:
- Base the approach ONLY on the provided title, problem statement, tags, and optional code.
- Produce a standardized step-by-step approach a student can follow, for example:
  1) Restate the goal / inputs / outputs
  2) Key observations / patterns
  3) Algorithm steps
  4) Edge cases
  5) Time and space complexity
- Prefer the language of the problem statement (do not translate Chinese ↔ English).
- Do NOT invent constraints, sample I/O, or facts not supported by the statement.
- If the statement is missing, empty, or too vague to outline a real approach,
  reply with exactly: INSUFFICIENT_STATEMENT
- Return only the approach markdown/text (or INSUFFICIENT_STATEMENT), no preamble."""


def _statement_issue(statement: str) -> str | None:
    text = statement.strip()
    if not text:
        return "empty"
    if len(text) < MIN_STATEMENT_CHARS:
        return "incomplete"
    return None


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


@router.post("/approach", response_model=RewriteResponse)
async def generate_approach(
    body: GenerateApproachRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> RewriteResponse:
    issue = _statement_issue(body.statement)
    if issue == "empty":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem statement is required before generating an approach",
        )
    if issue == "incomplete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem statement looks incomplete; add more detail before generating",
        )

    cfg, api_key = await require_chat_config(db, user_id)
    tags = ", ".join(tag.strip() for tag in body.tags if tag.strip()) or "(none)"
    user_content = (
        f"Title:\n{body.title.strip() or '(untitled)'}\n\n"
        f"Problem statement:\n{body.statement.strip()}\n\n"
        f"Tags: {tags}\n\n"
        f"Code (optional reference):\n{body.code.strip() or '(none)'}\n"
    )
    rewritten = await chat_completion(
        base_url=cfg.chat_base_url,
        api_key=api_key,
        model=cfg.chat_model,
        messages=[
            {"role": "system", "content": GENERATE_APPROACH_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0.3,
    )
    text = rewritten.strip()
    if text == "INSUFFICIENT_STATEMENT" or text.startswith("INSUFFICIENT_STATEMENT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem statement is too vague to generate a reliable approach",
        )
    return RewriteResponse(rewritten=text)
