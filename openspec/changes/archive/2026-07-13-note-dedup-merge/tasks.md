## 1. Backend: similarity and title uniqueness

- [x] 1.1 Add schemas + `POST /notes/similar` (or equivalent) that embeds title+statement, returns top-3 owner matches above threshold; empty list on missing/failed embedding
- [x] 1.2 Add unique-title helper: on create, if `(user_id, title)` taken, assign `Title (2)`, `(3)`, …; apply on `POST /notes` and import commit create path
- [x] 1.3 Optional: Alembic unique constraint `(user_id, title)` after backfilling any existing collisions with suffixes

## 2. Backend: merge save and AI merge

- [x] 2.1 Add merge endpoint (or extend PATCH) that applies canvas field values to an owned note and appends one `review_dates` timestamp; re-embed when ready
- [x] 2.2 Add AI field-merge chat endpoint with merge-biased prompt (existing + incoming → one string); reject without chat config; do not reuse format-only rewrite prompt

## 3. Frontend: resolve experience

- [x] 3.1 Add shared resolve page/component at `/notes/resolve` and/or `/import/resolve` with top-3 picker, incoming reference, existing editable canvas, empty-field prefill, Reverse snapshots
- [x] 3.2 Wire Save → merge API then return to origin; Keep as new → create API (unique title) then return to origin
- [x] 3.3 Wire per-field AI merge + Reverse; persist draft/candidate handoff via store (import-store / session) with `from=import|new`

## 4. Frontend: Import and New Note entry points

- [x] 4.1 After import extract, batch-call similar for candidates; show Solve affordance before Remove when matches exist; track `mergedNoteId` so commit skips merged candidates
- [x] 4.2 Import commit: create-as-new only for unresolved candidates; honor unique titles
- [x] 4.3 New Note save: call similar; if matches, navigate to resolve with draft; if none, create as today
- [x] 4.4 Add i18n strings (en + zh-CN) for conflict/solve/resolve/merge/keep-as-new/reverse

## 5. Verification

- [x] 5.1 Manual: import near-duplicate → Solve → Save merges + review_dates; ignore → new note with title suffix if needed
- [x] 5.2 Manual: New Note near-duplicate → resolve → Keep as new vs Save; confirm note detail edit save does not enter resolve
- [x] 5.3 Manual: no embedding config → no Solve icons / empty similar → create still works; AI merge without chat shows error
