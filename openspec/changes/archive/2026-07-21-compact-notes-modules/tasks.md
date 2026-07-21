## 1. Phase A — Client BFF and notes API

- [x] 1.1 Add `frontend/src/lib/bff.ts` with `bffFetch` / shared JSON error extraction matching current BFF `{ error }` behavior
- [x] 1.2 Add `frontend/src/lib/notes-api.ts` (`fetchSimilarNotes`, `createNote`, `getNote`, `updateNote`, `deleteNote`, draft serialize with difficulty clamp + pitfalls normalize)
- [x] 1.3 Migrate `notes/new`, `notes/[id]`, and other notes create/similar call sites (including resolve keep-as-new if it POSTs `/notes`) to `notes-api`
- [x] 1.4 Migrate remaining easy BFF call sites touched by this work (`ask-sessions`, `rewrite`, settings llm-config load/save/verify, `usePreferredCodeLanguage`) onto `bffFetch` without changing endpoints
- [x] 1.5 Unify `SimilarMatch` / `SimilarMatchSummary` into one shared type and update import/resolve stores

## 2. Phase A — Session guard and llm-config read

- [x] 2.1 Add `useRequireSession` hook (session + redirect to `/login` + pending gate)
- [x] 2.2 Replace duplicated session redirect blocks on protected pages (notes list/detail/new, import, ask, settings, ResolveConflictPage)
- [x] 2.3 Share llm-config GET helper between Settings and `usePreferredCodeLanguage` (no language context cache)

## 3. Phase A — Backend helpers

- [x] 3.1 Add shared `get_owned_note` and replace the four owned-note 404 copies in `app/api/notes.py`
- [x] 3.2 Extract shared tag/difficulty note filter helper; use from list notes and ask retrieval filters
- [x] 3.3 Extract shared pgvector distance / vector-literal helper; use from `retrieval` and `notes_dedup`
- [x] 3.4 Optional stretch: move `_load_context_notes` to a public notes helper and update `ask_sessions` import only if the diff stays small

## 4. Phase A — Verify glue

- [x] 4.1 Run existing frontend unit tests; fix any breakages from renames/imports
- [x] 4.2 Manually smoke: unauthenticated redirect, notes list, create with similar hit → resolve, create without similar → detail, ask session list still loads

## 5. Phase B — Shared NoteEditorForm

- [x] 5.1 Extract `useNoteFieldEdit` (and labels helper if useful) for active markdown field snapshot/begin/cancel
- [x] 5.2 Add `NoteEditorForm` with shared fields + footer/side slots; move JSX from `notes/new` and `notes/[id]` with minimal className/layout drift
- [x] 5.3 Wire `notes/new` to `NoteEditorForm` (create submit stays on the page)
- [x] 5.4 Wire `notes/[id]` to `NoteEditorForm` (practice history, save/delete, dirty bar remain page-owned via slots or adjacent UI)
- [x] 5.5 Confirm Resolve/import editors were not merged into `NoteEditorForm`

## 6. Phase B — Verify editor

- [x] 6.1 Manually verify new-note: markdown edit/cancel, AI rewrite, tags/difficulty, submit paths
- [x] 6.2 Manually verify note-detail: load, dirty bar discard/save, save-and-return, delete, practice history
- [x] 6.3 Re-run frontend tests relevant to note editing components
