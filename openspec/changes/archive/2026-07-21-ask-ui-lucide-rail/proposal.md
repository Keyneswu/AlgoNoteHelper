## Why

Ask’s left rail currently mixes a Sessions|Notes toggle, a redundant “Sessions” heading, and text-heavy controls. That fights a ChatGPT-style history spine and buries the conversation. We want icon-forward chrome (Lucide), a collapsible history-only rail, and a lighter Context Notes entry (Notebook chip) while keeping durable ask-sessions and the existing Ask stream.

## What Changes

- Replace text-heavy Ask chrome with **Lucide** icons (`lucide-react`): new chat → `Plus`, delete → `Trash2`, send/stop → `Send`/`Square`, rail collapse → `PanelLeftClose`/`PanelLeftOpen`, context entry → `Notebook`, pending → `Loader2`.
- Left rail becomes **history-only**: remove Sessions|Notes toggle and the “Sessions” section title; default content is the session list.
- Add **ChatGPT-style collapse**: collapsed rail keeps a narrow **icon strip** (expand + new chat); session titles hidden until expanded. Persist preference in `localStorage`.
- Move Context Bar out of the rail into a **Notebook chip** above the composer (popover lists notes; user can remove; chip **hidden when count is 0**). Backend `context_note_ids` / merge / remove behavior unchanged.
- Align Ask thread/composer UX with **assistant-ui patterns** (Composer Send/Cancel, ThreadList visual idioms) without migrating session state to `RemoteThreadListRuntime` in this change.
- Unify pending visuals on Ask (and shared pending helpers touched by this work) on Lucide `Loader2`; prefer the same pattern when touching other `isPending` UIs in scope.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `ask-chat`: Left rail is history-only with ChatGPT-style icon-strip collapse; Context Bar becomes a Notebook chip + popover (not a rail mode); Ask chrome uses Lucide; auto-switch-to-Notes-on-send is removed.

## Impact

- **Frontend**: `ask/page.tsx`, `AskSessionList`, `AskRailToggle` (remove or retire), `AskContextBar` (reuse inside popover), `AskThread` composer, i18n keys, `globals.css` ask-rail styles; add `lucide-react`.
- **assistant-ui**: Keep `useLocalRuntime` + custom session list; adopt Composer/ThreadList **UI patterns** from docs/registry. Full `useRemoteThreadListRuntime` adapter over ask-sessions is **out of scope** (optional follow-up).
- **Backend / ask-sessions APIs**: No contract changes; context ids and session CRUD unchanged.
- **Design system**: Preserve existing dark canvas + accent tokens; do not introduce a second sidebar library (no shadcn `SidebarProvider` pull-in).
