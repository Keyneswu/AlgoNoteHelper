## Context

Ask already uses `@assistant-ui/react` (`useLocalRuntime` + `ThreadPrimitive` / `ComposerPrimitive`) with a **custom** durable session layer (`ask-sessions` BFF + `AskSessionList`). The left rail is a dual-mode Sessions|Notes toggle; Context Bar lives in Notes mode. Product direction: ChatGPT-like history spine, Lucide icon chrome, Context Notes as a secondary Notebook chip.

Existing visual system: dark `canvas` + green `accent` (keep). Stack: Next.js + HeroUI v3 + next-intl. Do not pull a second sidebar kit (shadcn Sidebar) into the app shell.

### assistant-ui research (docs / templates)

| Finding | Implication for this change |
| --- | --- |
| [ThreadList](https://www.assistant-ui.com/docs/ui/thread-list) / `ThreadListSidebar` + shadcn `SidebarProvider` | Good **layout reference** (new + list + trigger). Adopting registry `threadlist-sidebar` would drag shadcn sidebar into a HeroUI app — **skip install**; mirror the collapsed/expanded UX ourselves. |
| [ThreadListPrimitive](https://www.assistant-ui.com/docs/primitives/thread-list) + Lucide `Plus` / `Trash` | Official samples already use Lucide. Match that icon vocabulary on our custom list. |
| [Threads / RemoteThreadListAdapter](https://www.assistant-ui.com/docs/runtimes/concepts/threads) | Would unify list+thread under assistant-ui, but needs full adapter + history `unstable_Provider` over existing ask-sessions APIs — **large rewrite**. Out of scope. |
| [ComposerPrimitive](https://www.assistant-ui.com/docs/primitives/composer) `Send` / `Cancel` + Lucide `ArrowUp`/`Square` | Prefer wiring `ComposerPrimitive.Send` / `.Cancel` with Lucide icons instead of HeroUI Button + `aui.composer().send()`. |
| Attachment primitives | File-upload attachments — **not** the right model for practice-note grounding. Notebook chip stays custom. |
| Hosted templates (`chatgpt`, `base`) | Visual inspiration only; keep AlgoNote branding and existing markdown/answer pipeline. |

## Goals / Non-Goals

**Goals:**

- History-only left rail with ChatGPT-style **icon strip** when collapsed.
- Notebook chip + popover for context notes (editable remove; hidden at 0).
- Lucide as the Ask (and touched pending) icon library.
- Closer assistant-ui composer/list **patterns** without runtime migration.
- Preserve ask-sessions persistence, delete confirmation, streaming Ask.

**Non-Goals:**

- Migrating to `useRemoteThreadListRuntime` / AssistantCloud.
- Installing shadcn `Sidebar` / rewriting AppNav as icon-only.
- Silent grounding with **no** chip (future option); this change ships the chip.
- Chat folders, archive, or LLM titles.
- Full site AppNav icon redesign (optional later).

## Decisions

### D1 — Custom collapsible rail, not assistant-ui ThreadList runtime

**Choice:** Keep `AskSessionList` + page-level session state; add `collapsed` UI state.

**Why:** Sessions already persist via FastAPI/Postgres with context note hydration. RemoteThreadListAdapter would duplicate that and risk first-message races.

**Alternative:** `useRemoteThreadListRuntime` + adapter — deferred follow-up if we want primitive-driven list.

### D2 — Collapse = ChatGPT icon strip

**Choice:**

- Expanded (~240–260px): `PanelLeftClose` + `Plus` header; session rows with title + relative time; hover `Trash2` + existing AlertDialog.
- Collapsed (~52–56px): vertical `PanelLeftOpen` + `Plus` only; **no** session titles.
- Persist `ask.railCollapsed` in `localStorage`.
- `md+`: show rail (expanded or strip). Below `md`: keep compact session picker in header (iconify New chat); full rail remains `hidden` as today unless we later add a drawer.

**Alternative:** Fully hide rail (0 width) — rejected; user asked to match ChatGPT’s remaining icons.

### D3 — Remove dual-mode rail; Context → Notebook chip

**Choice:** Delete Sessions|Notes toggle and rail Notes mode. Context UI = chip above composer:

```
[ Notebook  {count} ]  → Popover → list (title, link to note, remove)
```

- Hidden when `contextNotes.length === 0`.
- Reuse `AskContextBar` logic (or extract shared list) inside HeroUI `Popover` / `Dropdown`.
- Still merge on `notes_added`, persist via existing `updateAskSession`.

**Alternative:** Completely silent context — deferred; user chose chip.

### D4 — Lucide everywhere in this surface; Loader2 for pending

**Choice:** Add `lucide-react`. Icon-only controls MUST set `aria-label` (i18n). Prefer `Loader2` + `animate-spin` over HeroUI `Spinner` in Ask and any pending helper we touch (`AiRewritePanel` may stay on Spinner until a follow-up unless cheap to swap).

**Alternative:** Mix HeroUI Spinner + Lucide — rejected for visual consistency on Ask.

### D5 — Composer via assistant-ui Send/Cancel

**Choice:** Refactor `AskThread` Composer to `ComposerPrimitive.Send` / `Cancel` with Lucide icons (`Send` or `ArrowUp`, `Square`), `asChild` onto HeroUI `Button` if needed for styling.

**Why:** Matches assistant-ui docs and removes duplicate send/cancel handlers.

### D6 — Visual signature (frontend-design)

- **Subject:** private algorithm-note Q&A companion.
- **Signature:** collapsible **history spine** — companion column, not a second app chrome (keep `.ask-rail` continuous canvas).
- **Restraint:** no new purple/cream theme; no numbered section markers; boldness spent on collapse + chip placement only.
- **Motion:** short width transition on expand/collapse; respect `prefers-reduced-motion` (instant toggle).

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Icon-only controls hurt discoverability | Tooltips + `aria-label`; i18n strings remain for a11y |
| Collapsed rail on narrow tablets feels cramped | Keep `md` breakpoint; mobile stays header select |
| Skipping RemoteThreadList means two “thread” concepts forever | Document follow-up; UI still looks ChatGPT-like |
| Chip hidden at 0 hides grounding concept for new users | Welcome copy already explains retrieval; chip appears after first retrieve |
| Width animation jank | CSS transition on width/grid; reduced-motion off |

## Migration Plan

1. Ship frontend-only; no DB/API migration.
2. Deploy as usual (`docker compose up --build` frontend).
3. Rollback: revert frontend image; `localStorage` key is harmless if left behind.

## Open Questions

- None blocking. Optional later: migrate sessions to `RemoteThreadListAdapter`; silent chip (tier C).
