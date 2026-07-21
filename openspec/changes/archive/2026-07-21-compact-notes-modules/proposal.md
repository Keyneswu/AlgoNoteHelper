## Why

Practice-note flows grew feature-by-feature, so the same client session guard, BFF fetch/error handling, notes CRUD calls, and note field editor UI are copied across pages; the backend repeats owned-note lookups, tag/difficulty filters, and pgvector SQL. The product behavior is fine, but the duplication raises change cost and drift risk. We want a behavior-preserving compaction: fewer call sites and one shared create/edit form, without restructuring routes or resolve/import UX.

## What Changes

- Add a shared client `bffFetch` (and thin error helper) so pages stop hand-rolling `fetch("/api/bff/...")` + JSON error parsing; migrate notes call sites and reuse from existing helpers such as `ask-sessions` / rewrite where straightforward.
- Add a `notes-api` client module for similar / create / get / patch / delete (and shared draft serialization: difficulty clamp + pitfalls normalize).
- Add `useRequireSession` so protected pages share one session + redirect + pending gate (no protected-route layout move in this change).
- Share `getLlmConfig` (or equivalent) between Settings and `usePreferredCodeLanguage` without introducing a global language cache/context.
- Extract `NoteEditorForm` used by `notes/new` and `notes/[id]` for the shared field block (title, statement/approach + AI rewrite, code, pitfalls, tags, difficulty), with slots for detail-only chrome (practice history, save/delete, dirty bar).
- Backend: extract `get_owned_note`, shared note tag/difficulty filter helper, and shared pgvector distance SQL helper; call sites keep the same HTTP contracts.
- Unify duplicate frontend types where trivial (`SimilarMatch` naming).

**Out of scope (explicit non-goals):**
- Protected `(app)` layout / route tree move
- Merging Resolve dual-column or import compact editors into `NoteEditorForm`
- Rewriting import ↔ resolve store coupling
- Fat-router → full service-layer migration beyond the small helpers above
- **BREAKING** API or UX changes (none intended)

## Capabilities

### New Capabilities
- `notes-module-structure`: Structural rules for the compacted notes client/backend modules — shared BFF client usage, session guard hook, notes API module, shared create/edit form, and backend owned-note / filter / vector helpers — without changing user-visible product behavior.

### Modified Capabilities
- `note-markdown-editing`: Clarify that create-note and note-detail inline Markdown editing SHALL share one editor form implementation (behavior unchanged; ownership of the UI moves to a shared component).

## Impact

- **Frontend:** `frontend/src/lib/` (new `bff` + `notes-api`), `frontend/src/hooks/useRequireSession`, `frontend/src/components/NoteEditorForm`, protected pages under `notes` / `ask` / `settings` / `import` / resolve, plus call-site cleanups in rewrite/ask-sessions/language hook as touched.
- **Backend:** `app/api/notes.py`, `app/api/retrieval.py`, `app/services/notes_dedup.py`, plus small new helper module(s) under `app/services/`.
- **APIs:** No path, payload, or response contract changes.
- **Deps:** None expected.
- **Risk:** Low for Phase A (glue extract); medium-low for Phase B (form extract — visual/regression check on new + detail only).
