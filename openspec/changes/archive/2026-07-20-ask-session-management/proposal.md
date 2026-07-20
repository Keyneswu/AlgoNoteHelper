## Why

Ask today is a single ephemeral client session (`sessionStorage` + in-memory). Users cannot return to past conversations across browsers or devices, and there is no ChatGPT-style list to create, switch, or delete chats. Multi-turn grounding already works; durable session management is the missing product layer.

## What Changes

- Persist Ask conversations in **Postgres**: `AskChatSession` + `AskChatMessage` tables (user-scoped), with `context_note_ids` on the session (store **ids only**, hydrate live notes on load; missing/deleted notes dropped silently).
- Add session CRUD APIs: list, create, get (messages + context ids), update (title / transcript / context ids after turns), hard delete.
- Replace the left-rail “Context Bar only + New session” chrome with a **dual-mode sidebar**: **Sessions | Notes** toggle (top-left). Clicking a session loads that thread; the rail stays on Sessions until the user **sends a question**, then auto-switches to Notes.
- Empty / first-visit behavior: ensure at least one session exists titled **New chat** (i18n); first user message truncates into the session title.
- Hard-delete a session only after an **AlertDialog** confirmation (same pattern as note delete); cascade-delete messages.
- **BREAKING** (capability): remove the `ask-chat` guarantees of “no server conversation records” and “no thread switcher.” Client `sessionStorage` is no longer the source of truth (optional cache only).
- Keep `/api/ask` and `/api/ask/stream` **stateless** (still accept `messages` + `context_note_ids`); persistence is a separate session layer written after turns.
- Out of scope for this change: chat folders UI (nullable `folder_id` hook only), soft archive / restore, LLM-generated titles, manual rename, note content snapshots, changing retrieval/SSE contracts beyond session plumbing.

## Capabilities

### New Capabilities
- `ask-sessions`: Durable Ask chat sessions in Postgres — list/create/switch/delete, message rows, `context_note_ids` storage, default “New chat”, title from first user message.

### Modified Capabilities
- `ask-chat`: Left rail becomes Sessions | Notes dual mode; auto-switch to Notes on send; load/save via server sessions instead of ephemeral-only state; drop “no ThreadList / no durable records” requirements.

## Impact

- Backend: new SQLAlchemy models + Alembic migration; new FastAPI routes under Ask/sessions; cascade delete; auth user scoping (same `X-User-Id` / bridged auth pattern).
- Frontend: `ask/page.tsx`, `AskContextBar` / new session list components, `ask-store` (demote or replace), `AskRuntimeProvider` remount on session switch (`sessionKey`); i18n `en` / `zh-CN`.
- Specs: new `ask-sessions`; delta on `ask-chat`.
- Deploy: Alembic migrate on prod after ship (manual SSH flow); no volume wipe.
- Unchanged: embedding/retrieval behavior, SSE event shape, Context Bar merge/remove semantics, assistant-ui LocalRuntime streaming path.
