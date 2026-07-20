## Why

Practice-note content is currently presented only as plain text inside always-editable textareas, so headings, examples, ASCII diagrams, and algorithm explanations are difficult to scan. The existing generic AI rewrite action also hides its intent and applies nearly the same behavior across fields that need different guarantees.

## What Changes

- Render problem statements and approaches as sanitized Markdown in the existing-note reading experience, with inline activation of Markdown source editing and an explicit preview.
- Keep unsaved inline edits in a page draft and expose clear save, discard, complete, and cancel states rather than silently persisting field changes.
- Present pitfalls as an ordered collection of independent single-line blocks; each item supports inline Markdown, individual editing, addition with Enter, deletion, and reordering-safe persistence through the existing string-array model.
- Replace the ambiguous generic AI rewrite control with field-specific named operations:
  - format a problem statement as faithful Markdown without changing its meaning;
  - organize an existing approach separately from generating a new approach;
  - clarify or shorten one selected pitfall;
  - avoid treating code formatting as generic prose rewriting.
- Add prompted rewrite so a user can supply an optional instruction while server-owned field policies continue to enforce grounding, language preservation, and non-invention requirements.
- Keep AI output as unsaved draft content for review, preview, undo, and explicit save.
- Reuse the existing Streamdown static Markdown renderer and current persistence types; no database migration is introduced.
- Scope the first delivery to note creation and note detail. Import preview and duplicate-resolution screens must preserve compatible Markdown/string-array data but do not gain the complete inline editing and prompted-rewrite UI in this change.

## Capabilities

### New Capabilities
- `note-markdown-editing`: Sanitized Markdown reading, inline Markdown source editing and preview, page-level dirty-state handling, and independent single-line pitfall blocks.

### Modified Capabilities
- `ai-field-rewrite`: Replace generic rewrite behavior with typed field-specific operations, optional user instructions, contextual grounding, and review-before-save behavior.
- `practice-notes`: Clarify that pitfalls are ordered single-line items and that note creation/detail editing preserves Markdown source for statement and approach content.

## Impact

- Frontend note creation/detail UI, shared Markdown presentation components, pitfall editing utilities/components, translations, and unsaved-draft state.
- FastAPI rewrite request schemas, field policy/prompt construction, operation validation, and error handling.
- Existing approach generation remains distinct from rewrite; generic code rewrite behavior is removed or replaced by an explicitly scoped operation.
- Existing PostgreSQL `Text` and `ARRAY(Text)` columns remain compatible, and the BFF continues to proxy the revised API.
- Automated coverage is needed for field-policy enforcement, prompted rewrite payloads, Markdown/pitfall editing behavior, and save/discard transitions.
