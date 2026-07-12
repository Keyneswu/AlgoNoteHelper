## Context

AlgoNoteHelper is a greenfield self-hosted app for algorithm practice note catalogs. Users import loose Markdown notes (often missing problem statements), edit structured fields, then unlock notes via metadata filters (Path 1) or semantic Q&A that must list matching notes before answering (Path 2). Auth and BYOK UX should feel like Job-Ops: first-run admin, no public signup, settings-managed users, per-user API keys with verify.

Constraints from exploration:
- Backend RAG/API in Python; multi-page UI in Next.js under `frontend/`
- Frontend component library: HeroUI v3 + Tailwind CSS v4
- Single Postgres with pgvector (no separate vector product for MVP)
- Better Auth on the frontend (email/password + admin plugin); FastAPI does not own login UI
- Admin manages accounts only and MUST NOT read other users' notes
- Chat and Embedding configs are separate (e.g. DeepSeek chat vs Aliyun Bailian embedding)

## Goals / Non-Goals

**Goals:**
- Ship an MVP catalog: import → edit → Path1/Path2 → Docker multi-user
- Keep retrieval dual-path: SQL/metadata first-class; vectors only for Path 2
- Ground Path 2 answers strictly on retrieved user notes
- Per-user BYOK with connection tests; secrets never fully re-echoed to the client

**Non-Goals:**
- Life-journal / personal daily RAG
- LeetCode sync, Anki, code syntax highlighting polish
- Semantic “make problem statement clearer” rewrite (format-clean only)
- Heavy RAG platforms (RAGFlow/Dify) as the core
- Username login (email only for MVP)
- Admin impersonation or cross-user note visibility

## Decisions

### D1 — Repo layout: backend-rooted monorepo with `frontend/`
- **Choice:** FastAPI application at repo root / `app/`; Next.js in `frontend/`; Compose at root.
- **Why:** Matches preferred mental model (Python owns RAG); still one Docker deploy unit.
- **Alternatives:** Separate repos (more ops overhead); Next-as-root (weaker fit for Python-first).

### D2 — Auth: Better Auth on Next.js + BFF to FastAPI
- **Choice:** Better Auth (`emailAndPassword` + `admin` plugin) mounted on Next. Browser calls Next for auth and for business Route Handlers that validate session then call FastAPI with `user_id` + internal shared secret. Disable public registration; first-run `/setup` creates the first admin when no users exist.
- **Why:** Familiar auth/admin APIs (`createUser`, `listUsers`); avoids cookie parsing in Python.
- **Alternatives:** Pure FastAPI JWT (more auth UI to invent); Bearer tokens from Better Auth to FastAPI (more cross-origin complexity for MVP).

### D3 — Data store: Postgres + pgvector
- **Choice:** One database: Better Auth tables + `practice_note` (+ tags/importance/timestamps) + embedding column/side table via pgvector.
- **Why:** Path 1 is SQL; Path 2 needs metadata-filtered vector search; fewer Compose services.
- **Alternatives:** Qdrant sidecar (better at scale, sync cost); Chroma (weaker multi-user Docker story).

### D4 — Practice note as retrieval atom
- **Choice:** One imported problem/note entry = one row = one embedding document (title + statement + approach + pitfalls; code excluded from primary embed by default).
- **Why:** Matches “list relevant topics/notes then answer”; avoids chunk-noise from code.
- **Alternatives:** Chunk by heading only; per-pitfall vectors (defer).

### D5 — Import pipeline: LLM extract + human preview
- **Choice:** Upload/paste Markdown → LLM extracts N entries with sparse fields allowed → import preview (edit/merge/delete) → commit. Folder/topic headings may suggest default tags.
- **Why:** Real notes vary; empty statement/pitfalls are valid.
- **Alternatives:** Pure regex for one template (too brittle for multi-user).

### D6 — Path 2 pipeline: retrieve → list → answer
- **Choice:** Rewrite query if needed → vector search (optional Path1 pre-filter) → return ranked note list → LLM answers using only those notes; if none, say so.
- **Why:** User-requested UX; reduces hallucination against “common LeetCode knowledge.”
- **Alternatives:** Answer-only RAG (rejected).

### D7 — BYOK: separate Chat and Embedding profiles per user
- **Choice:** Store encrypted/secret chat key + model and embedding key + model; UI “Test connection” for each; redacted hints on read.
- **Why:** Cheap DeepSeek chat vs Bailian free-tier embeddings.
- **Alternatives:** Env-only keys (simpler ops, worse multi-tenant BYOK); shared workspace keys (Job-Ops-like but less fit here).

### D8 — AI field rewrite: format-only
- **Choice:** Endpoint takes field + text; prompt forbids changing meaning / inventing constraints; returns cleaned text into the same textbox.
- **Why:** Explicit MVP scope; semantic clarification later.

### D9 — Product naming
- **Choice:** Product/repo target name **AlgoNoteHelper** (local folder may still be `rag-daily` until rename).
- **Why:** Reflects algorithm practice notes, not generic RAG daily journal.

### D10 — Frontend UI: HeroUI v3 + Tailwind CSS v4
- **Choice:** Build MVP pages with [@heroui/react](https://www.heroui.com/en/docs/react/getting-started/quick-start) and `@heroui/styles` on Tailwind CSS v4 / React 19+. No HeroUI Provider required (v3). Use compound components for forms, tables, dialogs, tabs (setup, login, notes, import, ask, settings).
- **Why:** Team familiarity + HeroUI MCP; covers the form-heavy Job-Ops-like UX without hand-rolling primitives.
- **Alternatives:** shadcn/ui (also fine, less familiar here); raw Tailwind only (slower for MVP forms).
- **Notes:** Follow official install order (`@import "tailwindcss"` then `@import "@heroui/styles"`). Prefer default tokens for MVP; brand theming can wait.

## Risks / Trade-offs

- **[Risk] Markdown shapes vary → bad splits** → Mitigation: import preview required before commit; low-confidence flags on ambiguous boundaries.
- **[Risk] BFF misconfiguration exposes FastAPI** → Mitigation: API binds internal network; reject requests without valid internal secret; never trust client-supplied `user_id` alone from the public internet.
- **[Risk] Embedding model change invalidates vectors** → Mitigation: store embedding model id on notes; re-embed on model/key change or provide rebuild action.
- **[Risk] Path 2 still hallucinates** → Mitigation: system prompt + only inject listed notes; UI shows list first; empty retrieval short-circuits.
- **[Risk] Secret storage** → Mitigation: encrypt at rest with server-side key from env; never return raw secrets; audit logs for admin user creates only.
- **[Trade-off] Thin custom RAG vs framework** → More control, more glue code; acceptable for MVP scope.
- **[Risk] HeroUI/Tailwind major upgrades** → Mitigation: pin versions at scaffold; follow HeroUI v3 docs (not v2); smoke-test Button after install.

## Migration Plan

1. Scaffold Compose + empty DB (pgvector image).
2. Run Better Auth migrations + Alembic for business tables.
3. First `docker compose up` → `/setup` creates admin + BYOK.
4. Rollback: drop volumes / restore DB dump; no production data assumed for first ship.

## Open Questions

- Exact default model IDs for DeepSeek chat and Bailian embedding (confirm against current provider docs at implement time).
- Whether Path 1-only browsing works with zero LLM keys (lean yes for MVP).
- Whether to rename the git remote/folder to `AlgoNoteHelper` in the same change or a follow-up.
