## Context

Problem statements, approaches, and pitfalls are currently edited as plain text in always-visible HeroUI textareas. Statement and approach are persisted as PostgreSQL `Text`; pitfalls are persisted as an ordered `ARRAY(Text)` and converted to/from one newline-delimited textarea in the frontend. The project already renders sanitized GFM through Streamdown for Ask answers, but note pages do not reuse that renderer.

The existing rewrite API accepts an unconstrained string field and applies one format-only prompt to statement and code. Approach generation is a separate endpoint and does not receive the current approach, while pitfalls have no AI action. AI responses replace the client draft immediately, although persistence still requires a later whole-note save.

This change crosses the note UI, local draft state, rewrite API schema, prompt construction, translations, and tests. Existing imported notes may contain plain text rather than well-formed Markdown, so presentation must not silently rewrite stored data.

## Goals / Non-Goals

**Goals:**

- Make existing notes readable by default through sanitized static Markdown rendering.
- Let users activate inline Markdown source editing without losing whole-note save semantics.
- Represent each pitfall visibly and interactively as one ordered, single-line item.
- Give each supported field explicit AI operations and optional user instructions.
- Keep generated output reviewable and reversible before it enters the page draft or database.
- Preserve current database columns and the generic BFF proxy.

**Non-Goals:**

- A WYSIWYG or block-document editor.
- Multiline Markdown inside one pitfall item.
- Automatic AI conversion of existing notes when they are opened.
- Full inline Markdown and prompted-rewrite UI in import preview or duplicate resolution.
- Generic AI modification of source code.
- Automatic persistence of every field edit.

## Decisions

### 1. Reuse Streamdown as a shared static note renderer

Extract a note-oriented Markdown presentation component from the same Streamdown stack already used by Ask answers. It will use static mode, retain the default sanitization and URL hardening, and provide note-specific typography and code-block styles.

Statement and approach use block Markdown. Each pitfall string is rendered separately and is therefore limited to inline/single-line Markdown by product convention. Existing plain text is rendered as valid Markdown input without mutation; users explicitly invoke statement formatting when legacy examples or ASCII diagrams need headings or fenced blocks.

This avoids a second Markdown dependency and keeps security behavior consistent. A WYSIWYG editor was rejected because the product needs occasional source editing rather than document-authoring complexity.

### 2. Use inline activation with explicit affordances

An existing note opens with statement and approach in reading mode. Hover/focus reveals an edit affordance, and activating either the affordance or a non-interactive area replaces that block in place with its Markdown source editor and preview control.

Clicking links, code controls, or other interactive descendants does not activate editing. Text selection does not activate editing. Keyboard users can focus the block and use Enter to edit and Escape to cancel. Mobile layouts keep the edit affordance visible because hover is unavailable.

Only one statement/approach editor or pitfall item editor is active at a time. Switching fields completes the current field into the page draft; it does not persist or discard it.

### 3. Separate field-edit state from page persistence state

The detail page maintains:

- a saved baseline loaded from the API;
- a mutable page draft;
- one active field with an entry snapshot for field-level cancel;
- optional AI candidate output and its pre-request snapshot.

“Complete” exits one inline editor after updating the page draft. “Cancel” restores that field's entry snapshot. Neither action persists. When the page draft differs from the saved baseline, a visible sticky save bar offers Save and Discard all. Successful whole-note save replaces both baseline and draft; Discard all restores the baseline.

The new-note page remains draft-first, but statement and approach receive source/preview controls and the same AI candidate-review behavior. This preserves the existing create and duplicate-detection flow.

Auto-save was rejected because it would change current failure handling, duplicate flow, and embedding refresh behavior while making multi-field edits harder to review.

### 4. Keep pitfalls as an ordered string array

No database or API shape migration is required. The frontend replaces the newline textarea with an ordered list of blocks plus a single-line composer:

- Enter commits a non-empty trimmed item.
- Pasting multiple lines creates one item per non-empty line.
- Activating a block edits only that item.
- An edited item containing line breaks is split into independent non-empty items.
- Deletion removes only the selected item.
- Array order remains the display and persistence order.

The renderer treats each item independently. This makes the one-line contract explicit while preserving compatibility with import, merge, embeddings, and existing rows.

### 5. Replace free-form field names with a typed operation contract

The rewrite request validates the target field, operation, target text, optional user instruction, and relevant note context. Supported combinations are:

- statement: `format_markdown` or `custom`;
- approach: `organize` or `custom`;
- pitfall: `clarify`, `shorten`, or `custom`.

Approach generation remains a distinct operation/endpoint because it creates content from statement context rather than rewriting existing content. Code is removed from the generic prose rewrite contract; deterministic language formatters or a future explicitly reviewed code-modification capability can address it separately.

Server-owned field policies define grounding, allowed transformations, output format, and language preservation. The optional user instruction is subordinate to those policies and cannot authorize invention or translation. Context is used only to ground the target operation:

- statement receives title as optional context;
- approach receives title, statement, tags, and optional code;
- pitfall receives title, statement, and approach.

Invalid field-operation combinations and missing required target content are rejected before calling the model. Prompt and field lengths receive explicit validation limits.

### 6. Review AI output as a candidate before applying it

AI output appears in a before/after review surface associated with the active field. The user applies or discards the candidate; applying changes only the page draft and retains an undo snapshot. The user must still save the note.

The target field snapshot is included with the request state. If the field changes while the request is pending, the returned candidate is marked stale and cannot overwrite the newer draft without a new request. This avoids silent lost edits and makes prompted rewrite behavior transparent.

The custom-instruction UI shows the selected target and operation and uses a bounded prompt input. Quick actions remain available without a custom instruction and are named by outcome rather than the generic label “AI rewrite.”

### 7. Preserve compatibility outside the initial UI scope

Import extraction, import preview, duplicate resolution, note merge, embeddings, and Ask grounding continue carrying statement/approach strings and pitfall arrays without schema conversion. They must not strip Markdown source, but their current textareas and AI merge interaction remain unchanged in this change.

## Risks / Trade-offs

- [Inline activation can interfere with selection, links, or code controls] → Require a visible edit affordance, ignore interactive descendants and active text selections, and provide keyboard activation.
- [“Complete” can be mistaken for persistence] → Show a persistent dirty indicator and sticky Save/Discard bar until the API confirms save.
- [Legacy ASCII diagrams still collapse under ordinary Markdown] → Do not mutate them automatically; provide the explicit faithful `format_markdown` action that can add fenced text blocks.
- [AI custom instructions can conflict with field guarantees or contain prompt injection] → Keep immutable server policies above user instructions, delimit target/context data, validate operation combinations, and test non-invention behavior.
- [An AI response can overwrite newer typing] → Version the target snapshot and reject stale candidate application.
- [Rendering stored Markdown introduces XSS and unsafe-link risk] → Preserve Streamdown's default sanitize/harden pipeline and do not enable unsanitized raw HTML.
- [Single-line pitfalls cannot express fenced code or nested lists] → Treat this as an intentional content-model constraint; use inline code and links only.
- [Import and resolve screens remain visually inconsistent] → Preserve data compatibility now and treat complete interaction parity as a follow-up change rather than expanding this delivery.

## Migration Plan

1. Add the shared renderer and new draft/editing components behind the existing authenticated note routes.
2. Deploy the validated rewrite contract and frontend calls together; retain approach generation compatibility during the transition.
3. Render existing strings directly without a data migration or background rewrite.
4. Verify old note create/update, import, merge, retrieval, and Ask flows still accept the unchanged persistence shapes.
5. Roll back by restoring the previous note form and rewrite route; stored Markdown remains ordinary text and requires no database rollback.

## Open Questions

- Complete import-preview and duplicate-resolution parity is intentionally deferred; a later proposal should decide whether those workflows use the same inline components or a denser bulk-edit variant.
