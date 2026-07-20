from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ask_sessions, health, llm_config, notes, retrieval, rewrite
from app.core.config import get_settings
from app.db.session import Base, engine
from app.models import (  # noqa: F401 — register metadata
    AskChatMessage,
    AskChatSession,
    PracticeNote,
    UserLlmConfig,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Ensure business tables exist (Alembic is preferred in prod; create_all for MVP boot).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(notes.router, prefix="/api")
    app.include_router(llm_config.router, prefix="/api")
    app.include_router(rewrite.router, prefix="/api")
    app.include_router(ask_sessions.router, prefix="/api")
    app.include_router(retrieval.router, prefix="/api")
    return app


app = create_app()


def run() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
