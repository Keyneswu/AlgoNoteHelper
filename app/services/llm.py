from __future__ import annotations

import json
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt_secret
from app.models.entities import UserLlmConfig


async def get_user_llm_config(db: AsyncSession, user_id: str) -> UserLlmConfig | None:
    result = await db.execute(select(UserLlmConfig).where(UserLlmConfig.user_id == user_id))
    return result.scalar_one_or_none()


async def require_chat_config(db: AsyncSession, user_id: str) -> tuple[UserLlmConfig, str]:
    cfg = await get_user_llm_config(db, user_id)
    if not cfg or not cfg.chat_api_key_enc or not cfg.chat_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure and verify chat credentials in Settings first",
        )
    return cfg, decrypt_secret(cfg.chat_api_key_enc)


async def require_embedding_config(db: AsyncSession, user_id: str) -> tuple[UserLlmConfig, str]:
    cfg = await get_user_llm_config(db, user_id)
    if not cfg or not cfg.embedding_api_key_enc or not cfg.embedding_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure and verify embedding credentials in Settings first",
        )
    return cfg, decrypt_secret(cfg.embedding_api_key_enc)


async def chat_completion(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float = 0.2,
) -> str:
    """Call an OpenAI-compatible chat endpoint.

    DeepSeek V4 defaults to thinking mode; we disable it for MVP latency/cost.
    Docs: https://api-docs.deepseek.com/guides/thinking_mode
    """
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        # DeepSeek V4: thinking defaults to enabled; disable for format/extract/answer MVP.
        "thinking": {"type": "disabled"},
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Chat provider error: {resp.status_code} {resp.text[:400]}",
            )
        data = resp.json()
        try:
            message = data["choices"][0]["message"]
            content = message.get("content") or ""
            if not content and message.get("reasoning_content"):
                # Fallback if a provider ignores thinking=disabled
                content = str(message["reasoning_content"])
            if not content:
                raise KeyError("empty content")
            return content
        except (KeyError, IndexError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unexpected chat provider response",
            ) from exc


async def create_embedding(
    *,
    base_url: str,
    api_key: str,
    model: str,
    text: str,
) -> list[float]:
    url = base_url.rstrip("/") + "/embeddings"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model, "input": text, "dimensions": 1024}
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code >= 400:
            # Retry without dimensions for providers that reject it
            payload.pop("dimensions", None)
            resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Embedding provider error: {resp.status_code} {resp.text[:400]}",
            )
        data = resp.json()
        try:
            return data["data"][0]["embedding"]
        except (KeyError, IndexError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unexpected embedding provider response",
            ) from exc


def parse_json_array(content: str) -> list[dict[str, Any]]:
    content = content.strip()
    if content.startswith("```"):
        lines = content.splitlines()
        lines = [ln for ln in lines if not ln.strip().startswith("```")]
        content = "\n".join(lines).strip()
    data = json.loads(content)
    if isinstance(data, dict) and "candidates" in data:
        data = data["candidates"]
    if not isinstance(data, list):
        raise ValueError("Expected JSON array")
    return data
