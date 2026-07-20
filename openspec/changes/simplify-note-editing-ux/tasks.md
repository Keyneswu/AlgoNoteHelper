## 1. Backend: shrink rewrite API

- [ ] 1.1 Remove `custom` and all `pitfall` rewrite policies from schemas and `app/api/rewrite.py`; keep only `statement`+`format_markdown` and `approach`+`organize`
- [ ] 1.2 Remove generate-approach endpoint, request schema, message builders, and related client helpers
- [ ] 1.3 Update backend rewrite tests to cover remaining ops and reject removed combinations / generate-approach

## 2. Pitfall data helpers

- [x] 2.1 Change pitfall normalize/replace helpers so internal newlines stay in one item (trim + drop blanks only); update `pitfalls` unit tests
- [x] 2.2 Rebuild `PitfallBlocks` as a full-width 2-column (1-column mobile) amber card grid of always-on multiline textareas with bottom Remove, section Add, and expand-when-≥6; remove AI `actions` slot
- [x] 2.3 Update `PitfallBlocks` tests for multiline keep, add/remove, and ≥6 expand behavior

## 3. Markdown field UX

- [ ] 3.1 Make `InlineMarkdownField` Edit-only (no preview click/keyboard activation); enlarge/emphasize Edit; update component tests
- [ ] 3.2 Add 50vh collapse + expand for long rendered statement/approach content
- [ ] 3.3 Add spinning pending indicator to `AiRewritePanel` active actions; remove custom-rewrite UI; update panel tests

## 4. Page layout and copy

- [ ] 4.1 Reorder note detail and new-note pages: code → pitfalls → meta (tags+difficulty | practice history); wire Format / Organize only; drop generateApproach and pitfall AI
- [ ] 4.2 Shorten i18n labels (Format, Edit, organize, expand/collapse pitfalls, remove unused AI strings) in `en.json` and `zh-CN.json`
- [ ] 4.3 Confirm notes-list search (and other HeroUI async buttons) still show clear pending state; align if needed

## 5. Verification

- [ ] 5.1 Run focused frontend and backend tests for touched modules
- [ ] 5.2 Manually smoke note detail/new: Edit-only, Format/Organize + spinner, pitfall cards multiline/layout/≥6 expand, practice history right column, save/discard still work
