## 1. Backend Ask API

- [x] 1.1 Extend `AskRequest` with optional `messages` and `context_note_ids` (defaults empty for single-shot compatibility)
- [x] 1.2 Load owned notes for `context_note_ids`; ignore missing/non-owned ids
- [x] 1.3 On each turn: retrieve by latest question + filters; compute `notes_added` by id set difference vs context
- [x] 1.4 Build chat messages from prior `messages` + system grounding over full effective note set (`context ∪ notes_added`) using existing `build_answer_context`
- [x] 1.5 Update `/ask` JSON response to return `notes_added` and effective `notes` (and `answer`)
- [x] 1.6 Update `/ask/stream` to emit `notes_added` then `token*` then `done` (or `error`); keep empty-pool empty-answer behavior

## 2. Frontend dependencies and SSE

- [x] 2.1 Add `@assistant-ui/react` (and Thread UI scaffold via assistant-ui CLI or hand-rolled Thread primitives)
- [x] 2.2 Update BFF ask proxy types/bodies if needed for new fields
- [x] 2.3 Adapt `ask-sse` (or successor) to parse `notes_added` while remaining tolerant of legacy `notes` during transition

## 3. Context Bar and session state

- [x] 3.1 Replace single-result `ask-store` with session state: messages + context notes/ids + filters (+ optional sessionStorage)
- [x] 3.2 Build Context Bar UI: list notes, remove control, no manual-add; merge on `notes_added`
- [x] 3.3 Keep tag/difficulty pre-filters affecting retrieval only (do not auto-prune the bar when filters change)

## 4. assistant-ui Ask page

- [x] 4.1 Implement `ChatModelAdapter` that posts messages + `context_note_ids` + filters to stream API and yields cumulative assistant text
- [x] 4.2 Wire `LocalRuntime` + `AssistantRuntimeProvider` (single thread; no ThreadList)
- [x] 4.3 Rebuild `/ask` page layout: filters + Context Bar + Thread; remove old form/Disclosure-centric UX
- [x] 4.4 Theme Thread to existing canvas/surface/accent tokens; preserve AppNav and auth gate
- [x] 4.5 Add/update i18n strings for chat, Context Bar, empty pool, and errors (`en` + `zh-CN`)

## 5. Verification

- [x] 5.1 Manual: first turn retrieves, fills bar, streams answer
- [x] 5.2 Manual: follow-up merges new notes, answers with full bar, history affects reply
- [x] 5.3 Manual: delete a note from bar → next turn does not ground on it unless re-retrieved
- [x] 5.4 Manual: empty effective pool → clear “no relevant notes” behavior; no invented notes
- [x] 5.5 Manual: no thread switcher; refresh/session behavior matches chosen ephemeral policy
