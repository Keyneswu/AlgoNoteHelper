# Implementation plan for subagent-driven development
# Source of truth for requirements: openspec/changes/simplify-note-editing-ux/{proposal,design,specs,tasks}.md

## Global Constraints

- Prefer pnpm for frontend, uv for Python tests.
- No DB migration; pitfalls remain `TEXT[]`.
- Hard-remove unused AI: custom rewrite, generate-approach, all pitfall rewrite ops (UI + API).
- Keep statement `format_markdown` and approach `organize` only.
- Pitfalls: always multiline textarea cards; 2-col desktop / 1-col mobile; below code, above meta; ≥6 expand; amber rounded cards; actions at card bottom; no AI.
- Statement/approach: Edit-only activation (no preview click-to-edit); Edit control more prominent.
- Long rendered approach/statement: collapse at max-height 50vh when content exceeds it.
- AI buttons: spinning pending indicator.
- Meta layout: left tags+difficulty, right practice history.
- i18n: update en + zh-CN; shorten Format label.
- Commit after each task with a focused message.
- Follow TDD for helper/API changes; run focused tests before commit.
- Do not deploy or push unless asked.

## Task 1: Backend shrink rewrite API

- Remove `custom` and all `pitfall` rewrite policies from schemas and `app/api/rewrite.py`; keep only `statement`+`format_markdown` and `approach`+`organize`.
- Remove generate-approach endpoint, request schema, message builders, and related client helpers (`generateApproach` on note pages can be removed in Task 4 if still referenced — remove backend fully here; remove frontend API helpers if they exist).
- Update backend rewrite tests to cover remaining ops and reject removed combinations / generate-approach.

## Task 2: Pitfall data helpers and card grid UI

- Change pitfall normalize/replace helpers so internal newlines stay in one item (trim + drop blanks only); update `pitfalls` unit tests.
- Rebuild `PitfallBlocks` as a full-width 2-column (1-column mobile) amber card grid of always-on multiline textareas with bottom Remove, section Add, and expand-when-≥6; remove AI `actions` slot.
- Update `PitfallBlocks` tests for multiline keep, add/remove, and ≥6 expand behavior.

## Task 3: Markdown field UX and AI panel

- Make `InlineMarkdownField` Edit-only (no preview click/keyboard activation); enlarge/emphasize Edit; update component tests.
- Add 50vh collapse + expand for long rendered statement/approach content.
- Add spinning pending indicator to `AiRewritePanel` active actions; remove custom-rewrite UI; update panel tests.

## Task 4: Page layout and copy

- Reorder note detail and new-note pages: code → pitfalls → meta (tags+difficulty | practice history); wire Format / Organize only; drop generateApproach and pitfall AI.
- Shorten i18n labels (Format, Edit, organize, expand/collapse pitfalls, remove unused AI strings) in `en.json` and `zh-CN.json`.
- Confirm notes-list search (and other HeroUI async buttons) still show clear pending state; align if needed.

## Task 5: Verification

- Run focused frontend and backend tests for touched modules.
- Manually smoke or script-check note detail/new wiring: Edit-only, Format/Organize + spinner, pitfall cards multiline/layout/≥6 expand, practice history right column, save/discard still compile and tests pass.
- Fix any regressions found; mark OpenSpec `tasks.md` checkboxes complete for finished work.
