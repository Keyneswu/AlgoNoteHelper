# AlgoNoteHelper

Private algorithm practice note catalog with structured filters (Path 1) and retrieve → list → answer semantic search (Path 2).

## Stack

- **Frontend:** Next.js (App Router) + HeroUI v3 + Better Auth
- **API:** FastAPI + SQLAlchemy + Alembic
- **DB:** Postgres 17 + pgvector (`pgvector/pgvector:pg17-trixie`)

## Quick start (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- API health: http://localhost:8000/health

### First run

1. Open http://localhost:3000 — you will be redirected to `/setup` when no users exist.
2. Create the first **admin** account (email + password).
3. Sign in at `/login`.
4. In **Settings**, configure and **verify** Chat + Embedding API keys (BYOK).
5. Import Markdown notes, filter (Path 1), or Ask (Path 2).

### Admin add-user

Admins can open **Settings → Users** to create accounts (public registration is disabled).

## Local development

### Database

```bash
docker compose up db -d
```

Uses image `pgvector/pgvector:pg17-trixie` and enables the `vector` extension on init.

### API

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Business tables are created on API startup (`create_all`). Prefer Alembic for explicit migrations:

```bash
uv run alembic upgrade head
```

### Frontend

```bash
# Root `.env` is shared (frontend/.env → ../.env symlink created in repo setup)
cd frontend
pnpm install
pnpm dlx auth@latest migrate    # Better Auth tables
pnpm dev
```

## Identity bridge

Browser sessions are owned by Better Auth on Next.js. Route Handlers under `/api/bff/*` validate the session and call FastAPI with:

- `X-User-Id`
- `X-Internal-Secret`

FastAPI scopes all note operations by the bridged `user_id`. Admin role does **not** bypass note ownership.

## Environment

Copy `.env.example` → `.env` and fill secrets/API keys. Do **not** commit `.env`.

- `DATABASE_URL` — sync Postgres URL for Better Auth
- `DATABASE_URL_ASYNC` — async URL for FastAPI
- `DEEPSEEK_*` / `DASHSCOPE_*` — optional provider defaults (`deepseek-v4-pro`, `text-embedding-v3`); runtime BYOK still lives in Settings
- Change `INTERNAL_API_SECRET`, `BETTER_AUTH_SECRET`, and `SECRETS_ENCRYPTION_KEY` before any shared deployment
