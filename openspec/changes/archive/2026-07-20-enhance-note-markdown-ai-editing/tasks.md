## 1. Rewrite Contract and Field Policies

- [x] 1.1 Replace the free-form rewrite request schema with validated field, operation, target text, bounded optional instruction, and typed context inputs.
- [x] 1.2 Implement separate server-owned policies for statement Markdown formatting, approach organization, pitfall clarification/shortening, and compatible custom instructions.
- [x] 1.3 Keep approach generation distinct, remove code from generic prose rewrite behavior, and return clear validation errors for unsupported field-operation combinations.
- [x] 1.4 Add backend tests with a mocked chat completion for request validation, context selection, language/non-invention instructions, single-line pitfall output, custom prompt limits, and missing credentials.

## 2. Shared Markdown and Pitfall Primitives

- [x] 2.1 Extract a reusable static Streamdown note renderer that preserves the default sanitization/hardening and provides note-specific block and inline variants.
- [x] 2.2 Build an accessible inline Markdown field with rendered, source-edit, and preview states plus edit, Complete, Cancel, Enter, and Escape interactions.
- [x] 2.3 Ensure inline activation ignores active text selections, links, code controls, and other interactive descendants and remains discoverable on touch layouts.
- [x] 2.4 Replace newline textarea helpers with ordered single-line pitfall normalization supporting Enter add, multiline paste splitting, item edit, and item delete.
- [x] 2.5 Build the pitfall block/composer UI with sanitized inline Markdown rendering and per-item editing hooks.
- [x] 2.6 Add focused frontend tests for Markdown sanitization, inline activation boundaries, field cancellation, pitfall splitting, ordering, editing, and deletion.

## 3. AI Candidate Review UI

- [x] 3.1 Add typed frontend calls for field-specific quick operations and optional prompted rewrite context.
- [x] 3.2 Build field-aware AI controls with outcome-specific labels and a bounded custom-instruction popover or dialog.
- [x] 3.3 Build a before/after candidate review surface with Apply, Discard, and Undo behavior that never persists automatically.
- [x] 3.4 Track the target snapshot for each request and prevent a stale response from replacing a newer field draft.
- [x] 3.5 Remove the generic code AI rewrite control while retaining the existing CodeMirror editing experience.

## 4. New-Note Authoring

- [x] 4.1 Integrate source/preview Markdown fields for statement and approach into the new-note form.
- [x] 4.2 Integrate ordered pitfall blocks and the single-line composer into the new-note form.
- [x] 4.3 Integrate statement formatting, approach organization/generation, pitfall actions, custom prompts, candidate review, and undo into the new-note draft.
- [x] 4.4 Verify create submission and duplicate detection still receive Markdown source strings and normalized ordered pitfall arrays.

## 5. Existing-Note Reading and Draft Editing

- [x] 5.1 Refactor the detail page to maintain separate saved baseline, mutable page draft, active-field snapshot, and AI candidate state.
- [x] 5.2 Render statement and approach as Markdown by default and activate only one inline source editor or pitfall editor at a time.
- [x] 5.3 Replace the detail pitfall textarea with independent ordered Markdown blocks and the single-line composer.
- [x] 5.4 Add a persistent dirty-state Save/Discard control and make Complete update only the page draft, Cancel restore the field snapshot, and successful Save adopt the API response as baseline.
- [x] 5.5 Preserve delete, practice history, tags, difficulty, code editing, save-and-return, authentication, and error behavior after the page refactor.

## 6. Compatibility, Copy, and Verification

- [x] 6.1 Add Chinese and English copy for Markdown editing, preview, field-specific AI actions, custom instructions, candidate review, stale results, dirty state, and pitfall controls.
- [x] 6.2 Verify import preview, duplicate resolution, AI merge, embeddings, retrieval, and Ask grounding preserve Markdown strings and the existing pitfalls array without schema changes.
- [x] 6.3 Run backend tests and lint checks, then run frontend tests, lint, and production build.
- [x] 6.4 Manually verify desktop, keyboard, and touch flows for selection-safe inline activation, unsafe Markdown sanitization, legacy plain text, ASCII-example formatting, save/discard, AI apply/discard/undo, stale responses, and single-line pitfalls.
