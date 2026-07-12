from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AlgoNoteHelper"
    # Prefer DATABASE_URL_ASYNC so root `.env` can keep DATABASE_URL sync for Better Auth.
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/algonote",
        validation_alias=AliasChoices("DATABASE_URL_ASYNC", "DATABASE_URL"),
    )
    database_url_sync: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/algonote",
        validation_alias=AliasChoices("DATABASE_URL_SYNC", "DATABASE_URL"),
    )
    internal_api_secret: str = "dev-internal-secret-change-me"
    secrets_encryption_key: str = "dev-fernet-key-must-be-32-url-safe-base64="
    cors_origins: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
