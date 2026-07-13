## Context

Path 2 Ask today is single-turn: `POST /ask` and `POST /ask/stream` take `{ question, tags?, difficulty?, top_k }`, embed the question, retrieve top-k notes, then call chat with a one-shot `[system, user]` prompt built from those notes (`build_answer_context` labeled markdown). The frontend is a HeroUI form plus `AskAnswer` (Streamdown) and a Disclosure of retrieved notes; state lives in `ask-store` (memory + sessionStorage) as one `result`, not a message list.

This change turns Ask into a session-scoped chat: assistant-ui Thread for messages/streaming, and a separate Context Bar that owns the grounding note set across turns. No DB persistence and no multi-thread UI in v1.

## Goals / Non-Goals

**Goals:**

- Multi-turn follow-ups in one in-memory session with streaming answers.
- Context Bar: merge AI retrieval into a growing pool; user can delete; every answer grounds on the full current pool.
- Every turn re-retrieves (same pre-filters), merges by note id, then answers.
- Replace Ask chat chrome with assistant-ui (`LocalRuntime` + Thread), keep HeroUI for filters/Context Bar chrome where it fits the app.
- Stateless backend per request (client sends `messages` + `context_note_ids`).

**Non-Goals:**

- Persisting threads/messages in Postgres or Assistant Cloud.
- ThreadList / multiple concurrent conversations.
- Manual “add note to bar” from catalog search.
- Hard cap on Context Bar size.
- Changing embedding/grounding serialization to JSON schemas (keep labeled markdown parts).
- Tool-calling / agentic “decide whether to retrieve” loops.

## Decisions

### D1 — `LocalRuntime` + `ChatModelAdapter`, not ExternalStore / AI SDK

- **Choice:** Wire Ask with `@assistant-ui/react` `useLocalRuntime` and a custom `ChatModelAdapter` whose `async *run` calls the existing BFF `/api/bff/ask/stream` (adapted), yielding cumulative text for streaming. Context Bar state lives in React state (or a thin store) **outside** the runtime message list.
- **Why:** No Vercel AI SDK today; FastAPI custom SSE already exists. LocalRuntime owns message/streaming/cancel ergonomics without inventing a store. Context Bar is product state, not a message part.
- **Alternatives:** ExternalStoreRuntime (more boilerplate for no gain); migrate backend to AI SDK data stream (large unrelated rewrite).

### D2 — Client-owned context pool; backend is request-scoped

- **Choice:** Request body includes `messages` (prior user/assistant text turns), `context_note_ids` (ids currently in the bar), plus `question` (latest user text, or derived as last user message), `tags`, `difficulty`, `top_k`. Backend loads owned notes for those ids, runs retrieval on the latest question, computes `notes_added = retrieved − context`, answers with grounding = `context ∪ notes_added`, streams `notes_added` then `token*` then `done`.
- **Why:** Matches “no session DB”; delete-on-client is just “next request omits that id.”
- **Alternatives:** Server-side session store (out of scope); two-phase retrieve-then-answer endpoints (extra RTT).

### D3 — Every turn retrieves and merges

- **Choice:** Always retrieve on each user message; union into the bar; never auto-remove.
- **Why:** Product decision for follow-up UX when the topic drifts; user trims via delete.
- **Alternatives:** Retrieve only when bar empty / explicit “search again” (rejected for v1).

### D4 — Retrieval query = latest user message only

- **Choice:** Embed the newest user utterance for vector search, not the full transcript.
- **Why:** Matches current API; simple; bad hits can be deleted from the bar.
- **Alternatives:** Embed concatenated recent turns (better for pronouns, deferred).

### D5 — Grounding format stays labeled markdown

- **Choice:** Continue `build_note_context` / `build_answer_context` (`Title:`, `Statement:`, etc.). Prompt includes conversation history as chat messages plus a fresh “Retrieved notes” (or equivalent) block of the **full current pool**.
- **Why:** Already works; JSON-as-retrieval was explicitly dropped from this change.
- **Alternatives:** JSON note objects in the prompt (deferred).

### D6 — Single Thread, ephemeral persistence

- **Choice:** No ThreadList adapters. Optionally keep sessionStorage for messages + context ids (same spirit as today’s `ask-store`) so SPA navigations do not wipe the session; full page reload may clear or restore—prefer restore if cheap, but durability is best-effort only.
- **Why:** Scope A only.
- **Alternatives:** DB threads (later).

### D7 — Layout: Context Bar + Thread

- **Choice:** Ask page = filters (tags/difficulty) + Context Bar (note cards with remove) + assistant-ui Thread. Do not render retrieved notes primarily as in-message tool UIs in v1 (optional small “N notes added” affordance is fine).
- **Why:** Matches the agreed product sketch; keeps note management visible and editable.

### D8 — SSE event shape

- **Choice:** Prefer `notes_added` (array of note payloads) instead of reusing a full replacing `notes` event, so clients merge correctly. Keep non-stream `POST /ask` returning `{ notes_added, answer, notes }` (or `notes` = full effective grounding set) for fallback.
- **Why:** Avoids clients replacing the bar with only the latest top-k.

## Risks / Trade-offs

- **[Risk] Context grows without a hard cap → token/cost blowups** → Mitigation: product accepts user-managed deletes; document in UI hint; revisit cap later if needed.
- **[Risk] Every-turn retrieval adds latency + embedding cost** → Mitigation: expected; stream notes_added early so UI feels responsive before tokens.
- **[Risk] Deleted note still referenced in older assistant text** → Mitigation: acceptable; grounding for *new* answers uses current bar only.
- **[Risk] assistant-ui styling vs existing dark HeroUI shell** → Mitigation: theme Thread CSS variables to canvas/surface/accent tokens; keep AppNav.
- **[Risk] Stale `context_note_ids` (deleted note / other user)** → Mitigation: backend ignores missing/non-owned ids; answer only with successfully loaded notes.
- **[Trade-off] Latest-message-only embed may miss pronoun-heavy follow-ups** → Accept for v1; user can rephrase or rely on chat history in the LLM messages even if retrieval is weak.

## Migration Plan

1. Ship API extensions backward-compatibly: empty `messages` / empty `context_note_ids` behaves like today’s single-shot (retrieve → answer on that set).
2. Replace Ask frontend behind the same `/ask` route; remove old form-centric UI once Thread works.
3. Update i18n keys; no DB migration.
4. Rollback: revert frontend to previous Ask page; old clients can omit new fields if server defaults them.

## Open Questions

- Exact sessionStorage restore behavior on hard refresh (restore vs clean slate)—default to restore messages + context ids if storage allows.
- Whether non-stream JSON response should return full `notes` (effective pool) or only `notes_added`—prefer both: `notes_added` + `notes` (effective) for simpler clients.
