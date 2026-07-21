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

**Local vs production images:** `api` / `frontend` declare both `build:` and `image:` (`ghcr.io/keyneswu/algonote-*`). Locally, omit `IMAGE_TAG` and use `docker compose up --build`. In production CI/CD sets `IMAGE_TAG=<git-sha>`, then `docker compose pull api frontend` and `docker compose up -d` (no `--build`). Database data lives in the named volume `pgdata` — routine deploys do not replace it. **Never** run `docker compose down -v` on production unless you intend to wipe the database.

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
- `IMAGE_TAG` — optional; production deploy sets this to the git SHA of images pulled from GHCR

## CI / CD (GitHub Actions + GHCR)

### What runs where

1. **CI** (`.github/workflows/ci.yml`): on PRs and `main` — frontend lint/test, backend ruff/pytest. On `main` only — build and push `algonote-api` / `algonote-frontend` to GHCR tagged with the commit SHA (and `main`).
2. **CD** (`.github/workflows/deploy.yml`): after a successful CI run on `main` (or manual `workflow_dispatch`) — SSH to the host, sync the git checkout (for Compose), set `IMAGE_TAG`, `docker login` + `compose pull` + `up -d` without `--build`. Does **not** run Alembic or Better Auth migrate.

### GitHub configuration

| Kind | Name | Purpose |
|------|------|---------|
| Variable | `NEXT_PUBLIC_APP_URL` | Baked into the frontend image at CI build time (e.g. `https://algonote.keyneswu.com`) |
| Secret | `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`, `DEPLOY_PATH` | Existing SSH deploy |
| Secret | `GHCR_USERNAME` | GitHub username for `docker login ghcr.io` on the server |
| Secret | `GHCR_TOKEN` | PAT (or fine-grained token) with `read:packages` for the server to pull private images |

### One-time server setup

On the production host (after the first successful image push to GHCR):

```bash
# Optional smoke test before relying on Actions CD:
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
cd ~/dev/projects/AlgoNoteHelper   # or your DEPLOY_PATH
git fetch origin main && git reset --hard origin/main
# IMAGE_TAG = full git SHA of the commit whose images you want
export IMAGE_TAG=<sha>
# Persist for Compose (keeps other .env secrets):
grep -q '^IMAGE_TAG=' .env && sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/" .env || echo "IMAGE_TAG=${IMAGE_TAG}" >> .env
docker compose pull api frontend
docker compose up -d
docker compose ps
```

Watch the first auto-deploy carefully (or run the smoke path above once) before treating CD as routine.

### Schema changes (manual)

CD does **not** migrate the database. When a release includes Alembic or Better Auth schema changes:

1. Backup: `pg_dump` (or equivalent) against production.
2. Deploy the new app images as usual (or after a compatible migrate strategy).
3. Migrate API schema: `docker compose exec api alembic upgrade head`
4. If Auth tables changed: run Better Auth migrate from an environment that points at the same DB (see Local development → Frontend).
5. Verify health / login / a note list.

Rollback of **images**: set `IMAGE_TAG` to a previous known-good SHA, `pull` + `up -d`. Rollback of a bad **migration** is a restore-from-backup problem, not an image pull.
