from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_bridged_user(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_internal_secret: str | None = Header(default=None, alias="X-Internal-Secret"),
) -> str:
    """Identity bridge: trust only requests that carry the shared internal secret."""
    settings = get_settings()
    if not x_internal_secret or x_internal_secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal secret",
        )
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identity",
        )
    return x_user_id
