## Why

Algorithm learners already keep Markdown practice notes across platforms, but those notes are hard to reopen by topic, importance, or fuzzy scenario ("reservoir / water" style questions). AlgoNoteHelper turns personal practice notes into a private, searchable catalog with structured filters and AI-assisted retrieve-then-list-then-answer — without becoming a generic life journal or a heavy document-RAG suite.

## What Changes

- Bootstrap the **AlgoNoteHelper** product in this repo (rename/target name; backend-first layout with `frontend/`).
- Add **practice note catalog**: Markdown import (extract whatever fields exist), editable entries, tags, importance, optional problem statement field.
- Add **field-level AI rewrite** that only cleans formatting (no semantic clarification in MVP).
- Add **Path 1** retrieval: filter by tags, date, importance (and related metadata).
- Add **Path 2** retrieval: semantic search over note entries → **list relevant notes first** → then summarize/answer grounded only on that list.
- Add **auth & tenancy** (Job-Ops-like): no public signup; first-run creates admin via email/password; admin manages users in Settings; users never see each other's notes.
- Add **per-user BYOK**: separate Chat and Embedding API keys + model selection, with connection tests on first setup / settings.
- Deliver **Docker Compose** deployment: Next.js frontend, FastAPI backend, Postgres + pgvector.
- Build the MVP UI with **HeroUI v3** (`@heroui/react` + Tailwind CSS v4).

## Capabilities

### New Capabilities

- `practice-notes`: Practice note entries, Markdown import/preview, edit fields, tags, importance, isolation by user.
- `note-retrieval`: Path 1 structured filter and Path 2 retrieve → list → answer (entry-level embeddings).
- `ai-field-rewrite`: Per-field format-only AI rewrite (especially problem statement cleaning).
- `user-auth-admin`: Email/password auth, first-run admin bootstrap, admin user management, no public registration.
- `user-llm-config`: Per-user Chat vs Embedding provider keys/models with verify-connection.
- `project-bootstrap`: Repo layout, FastAPI + Next.js + HeroUI v3 + Postgres/pgvector, Docker Compose, BFF identity bridge.

### Modified Capabilities

- (none — greenfield)

## Impact

- New monorepo-style tree: Python FastAPI app at repo root / `app/`, Next.js under `frontend/`, Compose for `frontend` + `api` + `db`.
- Dependencies: uv/Python (FastAPI, SQLAlchemy, pgvector client), pnpm/Next.js, HeroUI v3 (`@heroui/react`, `@heroui/styles`) + Tailwind CSS v4, Better Auth (+ admin plugin), DeepSeek-compatible chat API, Aliyun Bailian/DashScope embedding API.
- No existing application code to migrate; current workspace is effectively empty aside from OpenSpec tooling.
- Future rename of folder/remote to `AlgoNoteHelper` may accompany implementation; product name is AlgoNoteHelper.
