## Why

Import and New Note currently always insert rows, so re-importing Markdown or recreating a nearly identical problem silently duplicates the catalog. Users need a soft conflict path: warn on near-duplicates, optionally merge into an existing note, and otherwise create a new note without blocking the default flow.

## What Changes

- Add similarity check (embedding top-k) against the current user's catalog when importing candidates and when saving a new note.
- Soft UX: show a conflict affordance (e.g. Solve) on import preview rows; ignoring it means create-as-new. New Note save that hits similars navigates to the same resolve experience.
- Shared side-by-side resolve UI (`/notes/resolve` or `/import/resolve` with one component): pick among top-3 matches; edit the existing-side result canvas; empty existing fields auto-fill from incoming; non-empty fields allow manual edit or AI merge of both versions; Reverse restores the original existing snapshot; exits via **Save** (merge into existing + append `review_dates`) or **Keep as new** (create).
- Enforce per-user unique titles on create; colliding titles get a numeric suffix (`(2)`, `(3)`, …).
- Out of scope for this change: conflict flow on editing an existing note detail page; silent auto-merge; hard block on duplicates.

## Capabilities

### New Capabilities
- `note-dedup`: Similarity detection, soft conflict signaling, shared resolve/merge UX, AI field merge (distinct from format-only rewrite), and per-user title uniqueness with suffixing.

### Modified Capabilities
- `practice-notes`: Import preview and create/commit paths gain optional conflict resolution and unique-title behavior on create-as-new.
- `practice-history`: Merging into an existing note MUST append a review timestamp (aligns with “practiced again”).

## Impact

- Backend: similarity endpoint (reuse pgvector embeddings), merge/update path with `review_dates` append, title uniqueness on create/import commit, optional AI-merge chat endpoint (new prompt, not format-only rewrite).
- Frontend: import candidate conflict icon; New Note save gate; shared resolve page/component; i18n strings.
- Depends on verified embedding config for similarity; missing/failed embedding MUST soft-fail (no conflict UI, allow create). Chat config required only for AI merge actions.
