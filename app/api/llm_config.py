from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt_secret, encrypt_secret, redact_key
from app.core.security import require_bridged_user
from app.db.session import get_db
from app.models.entities import UserLlmConfig
from app.schemas.notes import (
    LlmConfigOut,
    LlmConfigUpdate,
    VerifyConnectionRequest,
    VerifyConnectionResponse,
)
from app.services.llm import chat_completion, create_embedding, get_user_llm_config

router = APIRouter(prefix="/llm-config", tags=["llm-config"])


def _to_out(cfg: UserLlmConfig) -> LlmConfigOut:
    chat_key = decrypt_secret(cfg.chat_api_key_enc) if cfg.chat_api_key_enc else None
    emb_key = decrypt_secret(cfg.embedding_api_key_enc) if cfg.embedding_api_key_enc else None
    return LlmConfigOut(
        chat_provider=cfg.chat_provider,
        chat_base_url=cfg.chat_base_url,
        chat_model=cfg.chat_model,
        chat_api_key_hint=redact_key(chat_key),
        chat_verified=cfg.chat_verified,
        embedding_provider=cfg.embedding_provider,
        embedding_base_url=cfg.embedding_base_url,
        embedding_model=cfg.embedding_model,
        embedding_api_key_hint=redact_key(emb_key),
        embedding_verified=cfg.embedding_verified,
    )


async def _get_or_create(db: AsyncSession, user_id: str) -> UserLlmConfig:
    cfg = await get_user_llm_config(db, user_id)
    if cfg:
        return cfg
    cfg = UserLlmConfig(user_id=user_id)
    db.add(cfg)
    await db.commit()
    await db.refresh(cfg)
    return cfg


@router.get("", response_model=LlmConfigOut)
async def get_config(
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> LlmConfigOut:
    cfg = await _get_or_create(db, user_id)
    return _to_out(cfg)


@router.put("", response_model=LlmConfigOut)
async def update_config(
    body: LlmConfigUpdate,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> LlmConfigOut:
    cfg = await _get_or_create(db, user_id)
    data = body.model_dump(exclude_unset=True)
    if "chat_api_key" in data:
        key = data.pop("chat_api_key")
        if key:
            cfg.chat_api_key_enc = encrypt_secret(key)
            cfg.chat_verified = False
    if "embedding_api_key" in data:
        key = data.pop("embedding_api_key")
        if key:
            cfg.embedding_api_key_enc = encrypt_secret(key)
            cfg.embedding_verified = False
    for field, value in data.items():
        if value is not None:
            setattr(cfg, field, value)
            if field.startswith("chat_"):
                cfg.chat_verified = False
            if field.startswith("embedding_"):
                cfg.embedding_verified = False
    await db.commit()
    await db.refresh(cfg)
    return _to_out(cfg)


@router.post("/verify", response_model=VerifyConnectionResponse)
async def verify_connection(
    body: VerifyConnectionRequest,
    user_id: str = Depends(require_bridged_user),
    db: AsyncSession = Depends(get_db),
) -> VerifyConnectionResponse:
    cfg = await _get_or_create(db, user_id)
    try:
        if body.kind == "chat":
            api_key = body.api_key or (
                decrypt_secret(cfg.chat_api_key_enc) if cfg.chat_api_key_enc else None
            )
            if not api_key:
                raise HTTPException(status_code=400, detail="Chat API key required")
            base_url = body.base_url or cfg.chat_base_url
            model = body.model or cfg.chat_model
            await chat_completion(
                base_url=base_url,
                api_key=api_key,
                model=model,
                messages=[{"role": "user", "content": "Reply with exactly: ok"}],
            )
            if body.api_key:
                cfg.chat_api_key_enc = encrypt_secret(body.api_key)
            if body.base_url:
                cfg.chat_base_url = body.base_url
            if body.model:
                cfg.chat_model = body.model
            if body.provider:
                cfg.chat_provider = body.provider
            cfg.chat_verified = True
            await db.commit()
            return VerifyConnectionResponse(ok=True, message="Chat connection verified")
        else:
            api_key = body.api_key or (
                decrypt_secret(cfg.embedding_api_key_enc) if cfg.embedding_api_key_enc else None
            )
            if not api_key:
                raise HTTPException(status_code=400, detail="Embedding API key required")
            base_url = body.base_url or cfg.embedding_base_url
            model = body.model or cfg.embedding_model
            await create_embedding(
                base_url=base_url,
                api_key=api_key,
                model=model,
                text="ping",
            )
            if body.api_key:
                cfg.embedding_api_key_enc = encrypt_secret(body.api_key)
            if body.base_url:
                cfg.embedding_base_url = body.base_url
            if body.model:
                cfg.embedding_model = body.model
            if body.provider:
                cfg.embedding_provider = body.provider
            cfg.embedding_verified = True
            await db.commit()
            return VerifyConnectionResponse(ok=True, message="Embedding connection verified")
    except HTTPException as exc:
        if body.kind == "chat":
            cfg.chat_verified = False
        else:
            cfg.embedding_verified = False
        await db.commit()
        detail = exc.detail if isinstance(exc.detail, str) else "Verification failed"
        return VerifyConnectionResponse(ok=False, message=detail)
