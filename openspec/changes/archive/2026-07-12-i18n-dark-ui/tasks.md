## 1. i18n foundation

- [x] 1.1 Add `next-intl` via pnpm and wire `createNextIntlPlugin` in `frontend/next.config`
- [x] 1.2 Create `frontend/src/i18n/request.ts` that reads the `locale` cookie, validates `en` | `zh-CN`, defaults to `en`, and loads messages
- [x] 1.3 Add `frontend/messages/en.json` mirroring current UI copy (namespaces: nav, common, login, setup, notes, import, ask, settings)
- [x] 1.4 Add `frontend/messages/zh-CN.json` with Chinese translations for the same keys (keep brand `AlgoNoteHelper`)
- [x] 1.5 Wrap root layout with `NextIntlClientProvider`, set `<html lang={locale} className="dark ...">` from server-resolved locale

## 2. Locale switching UX

- [x] 2.1 Add AppNav language control that sets the locale cookie and calls `router.refresh()` without changing the pathname for locale
- [x] 2.2 Replace hardcoded chrome/page strings across pages and shared components with `useTranslations` / `getTranslations`
- [x] 2.3 Smoke: switch en ↔ zh-CN on notes/ask/settings; reload preserves locale; invalid cookie falls back to en

## 3. Dark UI restyle

- [x] 3.1 Update `globals.css` dark tokens (`--background`, `--foreground`, borders) aligned with HeroUI dark surfaces
- [x] 3.2 Replace light-only utilities (`bg-white`, light `slate`/`teal` panels) across pages and components with dark-compatible / semantic classes
- [x] 3.3 Switch CodeField / CodeMirror to a dark theme
- [x] 3.4 Ensure Ask answer / Streamdown code blocks use dark-appropriate highlighting
- [x] 3.5 Visual smoke: login, setup, notes list/detail/new, import, ask, settings — no light “holes”, no theme toggle UI

## 4. Verification

- [x] 4.1 Confirm no i18n middleware / `[locale]` route segment was introduced; `/api/*` unaffected
- [x] 4.2 Confirm user note bodies and Ask model text are not rewritten by locale switch
