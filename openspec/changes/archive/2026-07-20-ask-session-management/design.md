## Context

Ask today is multi-turn and streaming (`LocalRuntime` + Context Bar), but the conversation is ephemeral: `ask-store` (memory + `sessionStorage`) holds one transcript and full `PracticeNote` objects. There is no server conversation record, no thread list, and “New session” only clears client state. Stateless `POST /ask` and `/ask/stream` already accept `messages` + `context_note_ids` and ground answers on live owned notes.

This change adds durable, user-scoped sessions in Postgres and a ChatGPT-style session list in the left rail, without changing retrieval/SSE contracts. Persistence is a separate layer written after turns; ask endpoints stay request-scoped.

## Goals / Non-Goals

**Goals:**

- Persist Ask threads as `AskChatSession` + `AskChatMessage` rows (ids-only context on the session).
- Session CRUD: list, create, get (messages + context ids), update after turns, hard delete with confirm.
- Dual-mode left rail: **Sessions | Notes**; load session keeps Sessions mode; auto-switch to Notes only on send.
- Bootstrap at least one **New chat**; first user message becomes the title (truncated).
- Remount `AskRuntimeProvider` via `sessionKey` when switching sessions; hydrate notes live on load.

**Non-Goals:**

- Folders UI (nullable `folder_id` column only).
- Soft archive / restore; LLM titles; manual rename UI.
- Note content snapshots; embedding messages or context as JSONB blobs.
- Changing `/ask` / `/ask/stream` request/response or SSE event shapes beyond session plumbing.
- Assistant Cloud / ExternalStoreRuntime migration.

## Decisions

### D1 — Schema: session + message rows + `ARRAY(Integer)` context ids

- **Choice:** Two tables. `AskChatSession`: `id`, `user_id`, `title`, `context_note_ids` (`ARRAY(Integer)`, default `[]`), nullable `folder_id` (future), `created_at` / `updated_at`. `AskChatMessage`: `id`, `session_id` (FK, `ON DELETE CASCADE`), `role` (`user` | `assistant` | `system`), `content` (`Text`), `created_at`, ordered by `created_at` / `id`. No FK from context ids to `practice_notes`.
- **Why:** Matches “proper message table”; ids-only context stays cheap to PATCH; cascade delete matches hard-delete UX; `ARRAY(Integer)` matches existing Postgres ARRAY usage (`tags`, etc.).
- **Alternatives:** JSONB transcript blob (rejected — harder to query/partial-update); junction table for context notes (overkill); soft-delete columns (out of scope).

### D2 — API surface: `/ask/sessions` CRUD; PATCH after each completed turn

- **Choice:** New router prefix `/ask/sessions` (same bridged auth as notes/ask), e.g.:
  - `GET /ask/sessions` — list (id, title, updated_at; newest first)
  - `POST /ask/sessions` — create empty “New chat”
  - `GET /ask/sessions/{id}` — session + ordered messages + `context_note_ids` + hydrated note payloads (missing/non-owned ids dropped; D8)
  - `PATCH /ask/sessions/{id}` — replace title and/or messages and/or `context_note_ids` (full transcript replace is fine for v1)
  - `DELETE /ask/sessions/{id}` — hard delete (204)
  Keep `POST /ask` and `POST /ask/stream` unchanged and stateless. After a stream (or non-stream) turn finishes successfully, the client PATCHes the active session with the new transcript, updated `context_note_ids`, and title if still default. Context-bar remove also PATCHes ids promptly.
- **Why:** Separates generation from durability; failed/aborted streams do not leave half-written assistants unless the client explicitly saves; mirrors notes CRUD style.
- **Alternatives:** Persist inside the stream handler (couples SSE to DB, harder cancel); append-only message POSTs per turn (more RTTs, fine later if needed).

### D3 — Default “New chat” bootstrap

- **Choice:** On Ask page load (authenticated), if the user has zero sessions, `POST` one titled **New chat** (i18n display; store the localized or a stable default string — prefer i18n key resolution at create time for the active locale). Always keep at least one session: deleting the last one recreates a fresh New chat (or block delete of the sole empty New chat — prefer recreate-after-delete so delete UX stays uniform). “New chat” button creates another empty session and selects it.
- **Why:** Empty rail feels broken; ChatGPT-like default.
- **Alternatives:** Lazy-create only on first send (no list row until then — worse empty state).

### D4 — Title from first user message (truncate)

- **Choice:** While title is still the default New chat label, set title from the first user message: trim whitespace, collapse internal whitespace to single spaces, truncate to a fixed max (e.g. 60 chars) with ellipsis if needed. Do not overwrite a non-default title on later turns. No LLM rename in this change.
- **Why:** Instant, offline-cheap labeling; proposal lock.
- **Alternatives:** Always keep “New chat” until manual rename (deferred); LLM summary title (out of scope).

### D5 — Dual-mode rail + `sessionKey` remount

- **Choice:** Left rail top-left toggle: **Sessions | Notes**. Sessions mode: list + New chat + delete (AlertDialog, same pattern as note delete). Clicking a session loads it (GET → set messages, hydrate notes, bump `sessionKey`) but **does not** switch the toggle. Notes mode: existing Context Bar. Auto-switch rail to Notes only when the user **sends** a question (on adapter `run` start or first user submit). Mobile: keep a compact path (session picker / sheet) without inventing a third layout system.
- **Why:** Product lock; remounting LocalRuntime avoids stale `initialMessages` (already how “New session” works via `sessionKey`).
- **Alternatives:** Auto-switch to Notes on session click (rejected); ExternalStoreRuntime for hot-swap without remount (more churn, no gain for v1).

### D6 — Demote `ask-store`; active session id is source of truth

- **Choice:** Server sessions own transcript + context ids. Demote `ask-store` to optional thin UX cache (e.g. last `activeSessionId` in `sessionStorage`) or remove transcript/note persistence from it entirely. Page state: `activeSessionId`, `contextNotes` (hydrated), `messages`, `railMode`, `sessionKey`. Do not treat client storage as durable across devices.
- **Why:** Proposal BREAKING change vs “no server conversation records”; avoids dual sources of truth.
- **Alternatives:** Keep full transcript in sessionStorage as offline mirror (optional later; not required).

### D7 — Auth scoping

- **Choice:** Every session/message query filters `user_id == require_bridged_user`. Cross-user id → 404 (same as notes). Cascade delete only within owned sessions. No admin cross-user Ask history in this change.
- **Why:** Same ownership model as `PracticeNote` / ask retrieval.
- **Alternatives:** Shared sessions (out of scope).

### D8 — Hydrate context notes live; drop missing ids silently

- **Choice:** Persist only `context_note_ids` on the session. On GET/load, fetch owned `PracticeNote`s for those ids (order preserved where possible); omit missing or non-owned ids without error. Optionally rewrite stored ids on next PATCH to the surviving set. Never snapshot note bodies into messages or session rows.
- **Why:** Product lock; deleted notes should not break session load; matches ask endpoint’s ignore-missing behavior.
- **Alternatives:** Snapshot note text at answer time (rejected); hard-fail if any id missing (brittle).

## Risks / Trade-offs

- **[Risk] Full transcript PATCH races / lost updates if two tabs edit one session** → Mitigation: last-write-wins for v1; acceptable for private single-user MVP; revisit ETags later if needed.
- **[Risk] Large transcripts → large PATCH payloads** → Mitigation: Accept for personal Ask use; append-only message API later if size hurts.
- **[Risk] Stale title locale if New chat was created under another language** → Mitigation: Match default title by known en/zh strings or a `title_is_default` flag if matching gets messy; prefer simple string match for v1.
- **[Risk] Remount flashes / loses in-flight stream when switching sessions** → Mitigation: Disable switch during streaming or abort then switch; document as expected.
- **[Risk] Orphaned context ids after note delete** → Mitigation: Silent drop on hydrate (D8); next PATCH cleans the array.
- **[Trade-off] Stateless ask + client PATCH means a crash mid-save can lose the last turn** → Accept; retry PATCH on next focus if we keep an in-memory dirty flag (optional polish).

## Migration Plan

1. Alembic: add `ask_chat_sessions` + `ask_chat_messages`; deploy API routes; no change to ask stream contract.
2. Ship frontend dual-mode rail + session APIs behind `/ask`; stop relying on `ask-store` transcript as source of truth.
3. Prod: `git pull` + `compose up --build` + run Alembic migrate (manual SSH); named volume untouched.
4. Rollback: revert frontend to Context-Bar-only ephemeral Ask; leave tables in place (harmless) or drop in a follow-up migration if desired.
5. Existing `sessionStorage` Ask state: ignore or one-time discard; no import into Postgres required.

## Open Questions

- Exact max title length / ellipsis rules (60 vs 80) — pick one constant in implementation.
- Whether delete of the last session auto-recreates New chat immediately or after confirm dismiss — prefer immediate recreate.
- Mobile session-list chrome (sheet vs top strip) — follow existing mobile Context Bar density unless design review says otherwise.
