## 1. Dependencies and shared helpers

- [x] 1.1 Add `lucide-react` to `frontend` via pnpm
- [x] 1.2 Add a small Ask/shared icon helper pattern (size/`aria-hidden` defaults) and prefer Lucide `Loader2` for Ask loading states
- [x] 1.3 Add i18n keys for icon-only `aria-label`s (new chat, collapse/expand, context chip, send/cancel) in `en.json` / `zh-CN.json` as needed

## 2. History-only collapsible rail

- [x] 2.1 Remove Sessions|Notes toggle usage from `ask/page.tsx`; delete or stop exporting unused `AskRailToggle` / `railMode` state and auto-switch-to-Notes-on-send
- [x] 2.2 Refactor `AskSessionList`: drop “Sessions” heading; new chat → Lucide `Plus` (`isIconOnly` + `aria-label`); delete → `Trash2`; loading → centered `Loader2`
- [x] 2.3 Implement ChatGPT-style collapse on the Ask rail (expanded list vs ~52px icon strip with `PanelLeftOpen`/`PanelLeftClose` + `Plus`); persist `ask.railCollapsed` in `localStorage`
- [x] 2.4 Update `.ask-rail` styles for width transition; honor `prefers-reduced-motion`
- [x] 2.5 Mobile header: iconify new chat; keep session `<select>` without Notes rail mode / ContextBar strip in sessions mode

## 3. Notebook chip (context pool)

- [x] 3.1 Add Notebook chip above composer (Lucide `Notebook` + count); hide when `contextNotes.length === 0`
- [x] 3.2 Popover lists grounding notes with link + remove (reuse/adapt `AskContextBar`); keep merge/`updateAskSession` behavior
- [x] 3.3 Remove rail/mobile Notes-mode `AskContextBar` mounts from `ask/page.tsx`

## 4. Thread / composer (assistant-ui patterns)

- [x] 4.1 Refactor `AskThread` composer to `ComposerPrimitive.Send` / `Cancel` with Lucide icons and accessible names
- [x] 4.2 Show Lucide spinner (or thinking + spinner) while assistant run has empty streaming text if useful; keep Streamdown path intact

## 5. Verify

- [x] 5.1 Manual: expand/collapse rail, persistence reload, new chat, switch session, delete confirm
- [x] 5.2 Manual: ask a question → chip appears with count → remove a note → next turn omits it
- [x] 5.3 Run relevant frontend tests / typecheck; fix breakages from removed toggle or i18n keys

## 6. Site-wide Lucide chrome + pending loaders

- [x] 6.1 Extend `icons.tsx` with shared `PendingLabel` (Lucide `Loader2`) for HeroUI `Button` render-prop pending content; swap AiRewritePanel Spinner → same helper
- [x] 6.2 Settings: all async Buttons (password, verify chat/embedding, save, load users, create user, reset password) show PendingLabel when pending; add pending state for loadUsers/createUser if missing
- [x] 6.3 Import + notes list/new/detail + login/setup: every `isPending` Button shows PendingLabel; note detail loading uses AskLoader
- [x] 6.4 Iconify chrome actions (keep form CTAs as text+loader): AppNav logout → LogOut; back-to-notes → ArrowLeft; PracticeHistory/TagPicker/AskContextBar/CodeField remove/expand × → Lucide; ResolveConflict similar
- [x] 6.5 Update AiRewritePanel test if Spinner class assertion breaks; run tsc + vitest
