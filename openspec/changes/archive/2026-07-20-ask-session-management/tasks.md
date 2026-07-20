## 1. Backend models and migration

- [x] 1.1 Add `AskChatSession` and `AskChatMessage` SQLAlchemy models in `app/models/entities.py`: session fields (`id`, `user_id`, `title`, `context_note_ids` as `ARRAY(Integer)` default `[]`, nullable `folder_id`, `created_at`, `updated_at`); message fields (`id`, `session_id` FK with `ON DELETE CASCADE`, `role`, `content` Text, `created_at`); index `user_id` and `session_id`
- [x] 1.2 Export new models from `app/models/__init__.py` and register in `app/main.py` metadata import
- [x] 1.3 Add Alembic revision `0007_ask_chat_sessions.py`: create `ask_chat_sessions` and `ask_chat_messages` tables with cascade delete; no FK from `context_note_ids` to `practice_notes`
- [x] 1.4 Run migration locally and confirm tables exist (`alembic upgrade head`)

## 2. Backend schemas

- [x] 2.1 Add `app/schemas/ask_sessions.py` with Pydantic models: `AskChatMessageOut`, `AskChatSessionListItem`, `AskChatSessionListOut`, `AskChatSessionCreate`, `AskChatSessionUpdate` (optional `title`, `messages`, `context_note_ids`, `folder_id`), `AskChatSessionOut` (metadata + ordered messages + hydrated `context_notes: list[PracticeNoteOut]`)
- [x] 2.2 Add shared title helper: detect default **New chat** label (en + zh strings), truncate first user message (trim, collapse whitespace, max ~60 chars + ellipsis) for title-from-first-message rule

## 3. Backend session API routes

- [x] 3.1 Create `app/api/ask_sessions.py` router prefix `/ask/sessions` with `require_bridged_user` dependency (same pattern as `app/api/notes.py`)
- [x] 3.2 Implement `GET /ask/sessions` — list current user's sessions (at least id, title, `updated_at`; optional extra fields OK), ordered by `updated_at` desc
- [x] 3.3 Implement `POST /ask/sessions` — create empty session with default title **New chat** (accept optional `context_note_ids` / `folder_id`; filter ids to owned notes only)
- [x] 3.4 Implement `GET /ask/sessions/{id}` — return session + ordered messages + stored ids + hydrated owned notes (reuse `_load_context_notes` pattern from `app/api/retrieval.py`; drop missing/non-owned ids silently); cross-user id → 404
- [x] 3.5 Implement `PATCH /ask/sessions/{id}` — partial update: replace messages and/or `context_note_ids` and/or title; apply first-message title rule when title still default; filter context ids to owned set; bump `updated_at`; cross-user → 404
- [x] 3.6 Implement `DELETE /ask/sessions/{id}` — hard delete session (cascade messages), 204; cross-user → 404; idempotent if already gone
- [x] 3.7 Register router in `app/main.py` under `/api` prefix; confirm `/api/ask` and `/api/ask/stream` in `retrieval.py` remain unchanged and stateless

## 4. Frontend session API client

- [x] 4.1 Add `frontend/src/lib/ask-sessions.ts` (or extend types in `frontend/src/lib/types.ts`) with TS types mirroring session schemas and fetch helpers: `listAskSessions`, `createAskSession`, `getAskSession`, `updateAskSession`, `deleteAskSession` via `/api/bff/ask/sessions…`
- [x] 4.2 Confirm BFF proxy (`frontend/src/app/api/bff/[...path]/route.ts`) forwards new routes without body/header changes

## 5. Demote ask-store

- [x] 5.1 Refactor `frontend/src/lib/ask-store.ts`: remove transcript + full `PracticeNote` persistence as source of truth; keep only optional thin cache (e.g. last `activeSessionId` in `sessionStorage`) and shared helpers (`mergeContextNotes`, message types)
- [x] 5.2 Remove `saveAskSession` / `loadAskSession` transcript hydration from `frontend/src/app/ask/page.tsx`; page state owns `activeSessionId`, `contextNotes`, `messages`, `railMode`, `sessionKey`

## 6. Dual-mode left rail and session list UI

- [x] 6.1 Add `AskRailToggle` (Sessions | Notes) for top-left of left rail; state `railMode: "sessions" | "notes"`
- [x] 6.2 Add `AskSessionList` component: fetch list on mount, show title + relative/short `updated_at`, highlight active session, **New chat** button (`POST`), loading/empty states
- [x] 6.3 Wire rail layout in `frontend/src/app/ask/page.tsx`: Sessions mode → session list; Notes mode → existing `AskContextBar`; remove Context-Bar-only chrome as primary nav (drop standalone **New session** that only clears client state)
- [x] 6.4 Mobile: compact session picker (sheet or strip) consistent with existing mobile Context Bar density — no third layout system

## 7. Ask page session lifecycle

- [x] 7.1 On authenticated Ask load: `GET /ask/sessions`; if empty, `POST` one **New chat** (bootstrap D3); select most recently updated or the new session
- [x] 7.2 On session select: `GET /ask/sessions/{id}` → set `messages`, hydrate `contextNotes`, set `activeSessionId`, bump `sessionKey` for `AskRuntimeProvider` remount; keep `railMode` on **sessions** (do not auto-switch to Notes)
- [x] 7.3 **New chat** button: create session via API, select it, clear thread/context, bump `sessionKey`
- [x] 7.4 On adapter run start (user sends question): set `railMode` to **notes** (auto-switch D5); optionally disable session switch while streaming
- [x] 7.5 After successful stream completion in `AskRuntimeProvider`: PATCH active session with full transcript, current `context_note_ids`, and title if still default (first-message rule D4); do not PATCH on failed/aborted streams
- [x] 7.6 On Context Bar note remove: PATCH `context_note_ids` promptly (without waiting for next turn)
- [x] 7.7 After deleting last session: immediately recreate a fresh **New chat** and select it (uniform delete UX)

## 8. Session delete confirmation

- [x] 8.1 Add delete control per session row in `AskSessionList` with HeroUI `AlertDialog` (same pattern as note delete in `frontend/src/app/notes/[id]/page.tsx`)
- [x] 8.2 On confirm: `DELETE /ask/sessions/{id}`, refresh list, if deleted session was active select next or bootstrap New chat; handle last-session recreate (7.7)

## 9. i18n

- [x] 9.1 Add `en` + `zh-CN` strings under `ask.sessions` (and related keys): rail toggle labels (**Sessions** / **Notes**), **New chat**, empty list, delete confirm heading/body/actions, loading/error toasts
- [x] 9.2 Ensure default session title at create time uses active locale (`t("sessions.newChat")` or equivalent) so first-message rename detection matches stored default

## 10. Verification

- [x] 10.1 Manual: first visit with zero sessions → auto **New chat** appears in list
- [x] 10.2 Manual: complete a turn → session PATCH persists transcript + context ids; session rises in list order
- [x] 10.3 Manual: first user message renames default **New chat** title (truncated); later messages leave title unchanged
- [x] 10.4 Manual: switch sessions → correct transcript and Context Bar; `sessionKey` remounts thread; rail stays Sessions until send
- [x] 10.5 Manual: send question → rail auto-switches to Notes; Context Bar merge/remove still works
- [x] 10.6 Manual: delete session via AlertDialog → cascade removed; last session recreates **New chat**
- [x] 10.7 Manual: open Ask in another browser (same user) → conversations available from server list (not client `sessionStorage` transcript)
- [x] 10.8 Manual: session with deleted context note id loads without error; missing note omitted from bar
- [x] 10.9 Manual: `/api/ask/stream` still works without session id; SSE shape unchanged
