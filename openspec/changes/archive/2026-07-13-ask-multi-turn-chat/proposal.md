## Why

Ask is currently a single-shot form: one question in, one answer plus a disposable retrieved-notes list out. Users cannot follow up (“那第 12 行呢？”) without losing conversational context, and the custom Ask UI does not match a chat interaction model. We need session-scoped multi-turn Ask with a durable, user-editable note context pool, while keeping Path 2 grounded-only answers and streaming.

## What Changes

- Replace the Ask page form UX with an **assistant-ui** Thread (single conversation) plus streaming composer/messages.
- Add a **Context Bar** beside the thread that holds the session’s grounding notes: AI retrieval **only adds** (merge/dedupe by note id); users may **delete** notes; **manual add is out of scope** for v1.
- On **every** user turn: run semantic retrieval (same tag/difficulty pre-filters), merge newly retrieved notes into the Context Bar, then answer using **all notes currently in the bar** plus prior turn messages.
- Extend Ask APIs to accept conversation `messages` and current `context_note_ids`; stream `notes_added` then answer tokens (keep JSON non-stream fallback where useful).
- **No** server-side conversation persistence, **no** multi-thread / ThreadList / history sidebar in v1 (refresh may clear session state).
- Keep existing labeled markdown note serialization for embedding and answer grounding (no JSON-schema retrieval format in this change).
- Update Path 2 product language: the “list” is the live Context Bar snapshot, not only the latest retrieval batch.

## Capabilities

### New Capabilities
- `ask-chat`: Session-scoped multi-turn Ask UI (assistant-ui Thread), Context Bar lifecycle, streaming turns, and client-owned session state without durable threads.

### Modified Capabilities
- `note-retrieval`: Path 2 retrieve → list → answer becomes retrieve → merge into session context pool → answer grounded on the full current pool across turns; request/response contracts gain history + context note ids.

## Impact

- Backend: `app/api/retrieval.py`, `app/schemas/notes.py` (AskRequest/stream events); prompt assembly in `_ask_messages` / related helpers.
- Frontend: `frontend/src/app/ask/page.tsx`, `ask-store` / SSE helpers, new assistant-ui runtime + Thread + Context Bar components; dependency `@assistant-ui/react` (and Thread UI scaffolding).
- i18n: `frontend/messages/en.json`, `zh-CN.json` Ask strings.
- Specs: `openspec/specs/note-retrieval` Path 2 requirements; new `ask-chat` capability.
- Out of scope: DB chat tables, ThreadList, Assistant Cloud, manual note add to bar, hard cap on pool size, changing embed document structure to JSON.
