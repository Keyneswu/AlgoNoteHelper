## Why

Notes and Ask retrieval still mirror an early Path 1 design (free-text tags, min-importance threshold, date-range filters) that does not match how the owner actually finds problems: by topic tags and title keywords, with optional importance narrowing. Date ranges are almost unused for lookup, while practice history (how many times a problem was revisited) is missing from the note itself.

## What Changes

- Replace Notes list filters with: title substring search (`ILIKE`), preset tag multi-select with **AND** semantics, and importance multi-select (default all of High/Medium/Low; no "Any").
- **Remove** Notes list date-range filters from the UI (and stop advertising them as the primary Path 1 axes).
- Title and tag filters apply only on Enter / Search (Apply); **importance changes refetch immediately**, using the last committed title/tag query.
- Align Ask pre-filters to the same tag AND + importance multi-select semantics (preset tag picker), so questions like “medium and high importance DP notes” can constrain the embedding candidate pool.
- Add per-note **practice / review dates**: seed one date on create, show a chip list under pitfalls (with × to delete), and a button to append another practice date.
- **Out of scope**: duplicate-problem detection/merge; Fuse.js / fuzzy title search.

## Capabilities

### New Capabilities

- `practice-history`: Track and edit ordered practice/review dates on a practice note (create seed, append, delete), surfaced on the note detail UI.

### Modified Capabilities

- `note-retrieval`: Path 1 structured filter becomes title + tag AND + importance IN; date-range filtering removed from the product requirement; Ask Path 2 metadata pre-filter uses the same tag/importance semantics.
- `practice-notes`: Note model gains review/practice dates; list/edit UX expectations for filters move with retrieval (entry model still owns the new field).

## Impact

- Backend: `GET /notes` query params (`q`/`title`, tags AND via `@>`, `importance` multi-value); `AskRequest` importance multi-select; `PracticeNote.review_dates` (or equivalent) + migration; create/update schemas.
- Frontend: `/notes` filter bar, `/ask` tag+importance controls, `/notes/[id]` practice-history block; shared TagPicker / importance multi-select; i18n strings; `ask-store` tag shape migration.
- Specs: `note-retrieval`, `practice-notes`; new `practice-history`.
- No new search libraries; PostgreSQL `ILIKE` + array containment only.
