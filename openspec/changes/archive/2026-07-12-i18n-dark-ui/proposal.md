## Why

The UI is English-only and light-themed, which does not match how the primary user wants to use the app day-to-day. Adding cookie-based locale switching (default English, Chinese available) and a single dark visual style improves readability and localization without the cost of a full light/dark/system theme system.

## What Changes

- Add frontend i18n with `next-intl` for `en` (default) and `zh-CN`
- Persist locale in a cookie; switch from the app nav without URL locale prefixes or middleware
- Replace the light teal/slate look with a fixed dark palette (no user-facing theme toggle)
- Align HeroUI and custom surfaces to dark tokens; update CodeMirror / answer rendering colors for dark backgrounds
- Keep brand name `AlgoNoteHelper` untranslated across locales

## Capabilities

### New Capabilities
- `app-i18n`: Cookie-based locale (`en` default, `zh-CN`), message catalogs, nav language switcher, no middleware / no `[locale]` routes
- `dark-ui`: Fixed dark visual style for the frontend shell and pages (no light/dark/system preference UI)

### Modified Capabilities
- (none — existing note/auth/LLM requirements are unchanged; only presentation and chrome copy are affected)

## Impact

- **Frontend**: `layout.tsx`, `AppNav`, all user-facing pages/components with hardcoded English strings or light-only colors; new `messages/` catalogs and `i18n/request.ts`; `next.config` plugin for `next-intl`
- **Dependencies**: add `next-intl` (no `next-themes`)
- **Not in scope**: FastAPI API i18n, URL locale prefixes, middleware locale negotiation, account-synced locale prefs, light/system theme modes
