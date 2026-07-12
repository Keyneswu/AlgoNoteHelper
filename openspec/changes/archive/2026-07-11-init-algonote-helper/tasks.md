## 1. Project bootstrap

- [x] 1.1 Initialize Python project with uv (`pyproject.toml`) and FastAPI app package under `app/`
- [x] 1.2 Initialize `frontend/` Next.js app with pnpm, React 19, Tailwind CSS v4, and AlgoNoteHelper branding
- [x] 1.3 Install HeroUI v3 (`@heroui/react`, `@heroui/styles`), import styles after Tailwind in `globals.css`, and smoke-test a HeroUI `Button`
- [x] 1.4 Add Docker Compose with `frontend`, `api`, and Postgres+pgvector services plus env examples
- [x] 1.5 Wire health endpoints and confirm `docker compose up` brings the stack online

## 2. Auth and admin (Better Auth)

- [x] 2.1 Configure Better Auth with email/password, admin plugin, and shared Postgres
- [x] 2.2 Implement first-run `/setup` when zero users exist (creates admin)
- [x] 2.3 Implement login UI; disable public registration
- [x] 2.4 Add Settings user management for admins (list users, create user with email/password)
- [x] 2.5 Implement Next BFF/identity bridge to FastAPI (`user_id` + internal secret)

## 3. Practice notes data model and CRUD

- [x] 3.1 Create Alembic models/migrations for practice notes (fields, tags, importance, ownership, source meta)
- [x] 3.2 Implement FastAPI CRUD scoped strictly by bridged `user_id`
- [x] 3.3 Build notes list and detail/edit pages (textboxes for statement, approach, pitfalls, code; tags; importance)
- [x] 3.4 Verify admin cannot read another user's notes via API and UI

## 4. Per-user LLM configuration (BYOK)

- [x] 4.1 Persist per-user chat and embedding configs (key, model, provider/base URL) with encryption/secret storage
- [x] 4.2 Implement verify-connection for chat and embedding; store verified state; redact keys on read
- [x] 4.3 Add first-login / settings UX requiring configuration before AI-dependent features
- [x] 4.4 Inject per-user credentials into backend AI calls (never expose raw keys to the browser after save)

## 5. Markdown import

- [x] 5.1 Implement Markdown upload/paste API that calls chat model to extract candidate entries (sparse fields allowed)
- [x] 5.2 Build import preview UI (edit/remove/merge candidates) and commit-to-catalog flow
- [x] 5.3 On commit, create notes for current user and trigger embedding when embedding config is ready

## 6. Field-level AI rewrite

- [x] 6.1 Add rewrite endpoint with format-only system prompt (no semantic invention)
- [x] 6.2 Add per-field rewrite buttons on note edit form; apply result to textbox without auto-save
- [x] 6.3 Reject rewrite when chat config missing/unverified

## 7. Path 1 structured retrieval

- [x] 7.1 Implement filter API (tags, date range, importance) scoped to current user
- [x] 7.2 Build Path 1 filter UI that lists matching notes

## 8. Path 2 semantic retrieval

- [x] 8.1 Add pgvector storage and embed-on-write using title+statement+approach+pitfalls (exclude code by default)
- [x] 8.2 Implement retrieve → list → answer API grounded only on retrieved notes; handle empty results
- [x] 8.3 Build Ask UI that shows relevant note list first, then the answer/summary

## 9. Hardening and docs

- [x] 9.1 Add basic README for AlgoNoteHelper: compose up, first-run, BYOK, admin add-user
- [x] 9.2 Smoke-test end-to-end: setup → import sample Markdown → Path1 filter → Path2 scenario question
- [x] 9.3 Optional: rename local folder/remote to AlgoNoteHelper if desired in this change
