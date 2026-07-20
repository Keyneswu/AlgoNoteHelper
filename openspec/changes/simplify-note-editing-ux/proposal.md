## Why

The note detail and new-note pages grew too many AI affordances and awkward editing gestures (click-to-edit preview, custom rewrite, generate approach, pitfall AI). Pitfalls are forced into single-line items in a narrow column, which makes them hard to read and write. The owner wants a simpler editing surface: keep Markdown reading and a few useful AI actions, redesign pitfalls as always-editable multiline cards, and give clearer pending feedback on async buttons.

## What Changes

- **Remove** custom rewrite from UI and API (**BREAKING** for any client calling `operation: "custom"`).
- **Remove** approach generation endpoint and UI (**BREAKING** for `/rewrite/generate-approach` callers).
- **Remove** all pitfall AI rewrite operations (`clarify`, `shorten`, `custom`) from UI and API (**BREAKING**).
- Keep statement **Format** (shorter label) and approach **Organize** only.
- Statement/approach enter edit mode only via an explicit, more prominent **Edit** control — not by clicking the rendered preview (or keyboard activation on the preview surface).
- Approach (and other long rendered fields as needed) collapse when content exceeds **50vh**, with an expand control; normal-length content stays fully visible.
- Redesign pitfalls as a full-width section **below code and above tags/meta**: amber rounded cards, **2 per row** on desktop (1 on mobile), each card an always-on multiline **textarea** with actions at the card bottom; **≥6** items collapse behind an expand control.
- Move **practice history** into the right meta column (parallel with tags + difficulty on the left).
- Stop splitting pitfall items on newlines during normalize; each array element may contain internal line breaks.
- Show a **spinning pending indicator** beside AI action buttons (and ensure search/async buttons remain clearly pending).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `ai-field-rewrite`: Remove custom rewrite, approach generation, and all pitfall rewrite operations; retain statement format and approach organize; pending UX expectations for remaining actions.
- `note-markdown-editing`: Explicit Edit-only activation for statement/approach; long-content collapse at 50vh; replace single-line pitfall blocks with multiline always-textarea card grid and new page order.
- `practice-notes`: Pitfalls are ordered multiline strings (no newline-splitting into separate items); persist through existing `pitfalls` array without schema migration.
- `practice-history`: Present practice history in the right meta column alongside tags/difficulty, not under or as the pitfalls region.

## Impact

- Backend: `app/api/rewrite.py`, `app/schemas/notes.py`, rewrite/generate tests.
- Frontend: `AiRewritePanel`, `InlineMarkdownField`, `PitfallBlocks` (or replacement), note detail + new-note pages, i18n (`en`/`zh-CN`), related unit tests.
- Specs: living requirements for AI rewrite, markdown editing, pitfalls, and practice-history layout.
- No database migration; existing single-line pitfall strings remain valid.
