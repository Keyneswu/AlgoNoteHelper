## Context

Note detail and new-note pages currently combine Markdown reading with a dense AI rewrite panel (format, organize, generate, custom, pitfall clarify/shorten), click-to-edit preview surfaces, and single-line pitfall blocks squeezed into a right-hand column beside tags. The owner wants a simpler editing surface without losing Markdown for statement/approach or the existing `pitfalls: string[]` persistence model.

## Goals / Non-Goals

**Goals:**

- Remove unused AI surface area from UI and API: custom rewrite, generate approach, all pitfall rewrite ops.
- Keep statement Format and approach Organize with clearer pending feedback (spinner).
- Explicit Edit-only activation for statement/approach; stronger Edit affordance.
- Collapse long approach (and similarly long rendered content) at `max-height: 50vh`.
- Redesign pitfalls as a full-width multiline always-textarea card grid below code and above meta; ≥6 items use count-based expand.
- Place practice history in the right meta column opposite tags + difficulty.
- Preserve `TEXT[]` pitfalls without a DB migration; allow internal newlines per item.

**Non-Goals:**

- Changing import extraction prompts, Ask grounding, or embedding text assembly beyond accepting multiline pitfall strings.
- Drag-and-drop reordering of pitfall cards.
- Markdown preview mode inside pitfall cards (always textarea).
- Restoring or soft-deprecating removed rewrite endpoints (hard remove).

## Decisions

### 1. Hard-delete unused rewrite API surface

Remove `custom` from allowed operations, remove all `pitfall` field policies, and remove the generate-approach route/schema/tests. Remaining contract: `statement`+`format_markdown`, `approach`+`organize`.

**Alternatives considered:** UI-only hide (rejected — owner will not use these; keep API/spec aligned).

### 2. Explicit Edit only for statement/approach

`InlineMarkdownField` reading mode is non-interactive for edit activation (no `role="button"` click/Enter on the preview). Edit is a larger, accent-styled control in the field header. Source/preview tabs inside an active edit session stay as today.

**Alternatives considered:** Keep click-to-edit (rejected — accidental edits and unclear affordance).

### 3. Long content collapse at 50vh

Apply a shared collapse wrapper around rendered approach (and statement if needed) when scroll height exceeds `50vh`. Default collapsed; expand/collapse control appears only when content would exceed the cap. Respect `prefers-reduced-motion`.

**Alternatives considered:** Character/line thresholds (rejected — visual overflow is the problem).

### 4. Pitfall card grid (always textarea)

Page order: title → statement → approach → code → **pitfalls** → meta (tags+difficulty | practice history).

Pitfall section: 2-column grid on `sm+`, 1-column on mobile. Each item is an amber rounded card with a multiline textarea (Enter inserts newline; changes update page draft immediately). Card bottom: Remove (and Complete is unnecessary). Section footer: Add. When `length >= 6`, show first 6 and an expand control for the rest. Optionally clamp individual card textarea height so one card cannot explode a grid row.

Normalize helpers: trim and drop empty items only — **do not** split on `\n`. Paste is ordinary text into the focused textarea.

**Alternatives considered:** Read/edit toggle with Markdown preview (rejected — owner chose always-textarea). Return to single textarea for all pitfalls (rejected — loses per-item cards).

### 5. Pending spinner on AI actions

Replace label-only `…` pending state in `AiRewritePanel` with a visible spinner (HeroUI `Spinner` or equivalent CSS) next to the active button while the request runs. Notes list search already uses HeroUI `isPending`; keep that pattern and align AI buttons to the same clarity.

### 6. Spec updates via REMOVED/MODIFIED deltas

Document removals under `## REMOVED Requirements` (custom/prompted rewrite, generate-approach scenarios, pitfall AI, single-line pitfall rules) and rewrite layout/editing requirements under `## MODIFIED` / `## ADDED` as needed. Living specs update on archive.

## Risks / Trade-offs

- [Import / resolve UIs still use newline textareas for pitfalls] → They continue to work; multiline items round-trip as single array elements. Avoid reintroducing split-on-newline when saving from detail/new. Document that import preview may still look like one block per line until those screens are refreshed later (out of scope unless trivial).
- [Uneven card heights in a 2-col grid] → Prefer per-card max-height + internal scroll over forcing equal heights.
- [Breaking API for removed ops] → Private app; update client and tests in the same change; no versioned compatibility layer.
- [Losing Markdown rendering in pitfalls] → Accepted trade-off for editing clarity; statement/approach retain Markdown.

## Migration Plan

1. Ship frontend + backend together (compose rebuild).
2. No Alembic migration; existing pitfall strings remain valid.
3. Rollback: revert deploy; no data rewrite required.

## Open Questions

- None blocking implementation. Per-card max-height can be tuned during UI polish if 50vh section-level collapse for approach is insufficient for cards.
