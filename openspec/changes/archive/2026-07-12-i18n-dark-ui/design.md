## Context

Frontend is Next.js 16 App Router + HeroUI v3 + Tailwind v4 under `frontend/`. UI copy is hardcoded English; `layout.tsx` sets `lang="en"`. Visuals are light-only (`:root` mint background plus widespread `bg-white` / `slate-*` / `teal-*` classes). There is no `middleware.ts`. Settings already hold LLM and preferred code language prefs; appearance/locale prefs will stay device-local for this change.

## Goals / Non-Goals

**Goals:**
- Ship `en` (default) and `zh-CN` UI via `next-intl` without locale URL prefixes
- Persist locale in a cookie; allow fast switch from AppNav via cookie write + `router.refresh()`
- Adopt a single dark UI palette end-to-end (shell, pages, HeroUI, code editor, streamed answers)
- Keep API routes and auth bridge unchanged

**Non-Goals:**
- next-intl middleware / `[locale]` routing / Accept-Language redirects
- Light / dark / system theme toggle (`next-themes` not introduced)
- Syncing locale to the user account / FastAPI
- Translating user-generated note content or LLM answers
- Backend error-message localization

## Decisions

### 1. Cookie locale, no middleware
- **Choice**: `next-intl` “without i18n routing”: `i18n/request.ts` reads `locale` cookie (fallback `en`), `NextIntlClientProvider` in root layout, no `middleware.ts` / `proxy.ts`.
- **Why**: Matches a logged-in notes app (no SEO need for `/zh/...`); avoids matcher conflicts with `/api/bff` and `/api/auth`; smaller migration (no move of `app/` under `[locale]`).
- **Alternatives**: Prefix routing + middleware (more machinery); `localePrefix: 'never'` still with middleware (unnecessary for cookie-only).

### 2. Supported locales and default
- **Choice**: `en` | `zh-CN`; default `en` when cookie missing or invalid.
- **Why**: Product default stays English; Chinese available for the primary user.
- **Cookie**: e.g. `locale` with long `maxAge`; set from a small client LocaleSwitcher in AppNav, then `router.refresh()`.

### 3. Message organization
- **Choice**: `frontend/messages/en.json` and `zh-CN.json` with namespaces by surface (`nav`, `notes`, `ask`, `settings`, `login`, `setup`, `import`, `common`).
- **Why**: Pages are few; namespace-per-area keeps keys scannable without over-splitting files.
- **Brand**: Keep `AlgoNoteHelper` as the same string in both catalogs.

### 4. Fixed dark style (not a theme system)
- **Choice**: Force dark presentation: set `class="dark"` (and optional `data-theme="dark"`) on `<html>`, redefine app CSS variables for dark backgrounds/foregrounds, replace hardcoded light Tailwind utilities with semantic / dark-friendly classes.
- **Why**: HeroUI v3 dark tokens activate under `.dark`; no `next-themes` FOUC/hydration complexity; one palette to maintain.
- **Alternatives**: Dual light/dark with `next-themes` (explicitly deferred); only CSS `prefers-color-scheme` (cannot lock to dark).

### 5. Editor and markdown surfaces
- **Choice**: CodeMirror and Streamdown/Shiki use dark themes when rendering in the app.
- **Why**: Leaving them on light themes breaks the dark shell.

### 6. Preference placement
- **Choice**: Primary locale control in AppNav; no requirement to duplicate in Settings for v1 (optional later).
- **Why**: “Fast switch” belongs in the chrome users always see.

## Risks / Trade-offs

- **[Risk] Missed hardcoded English strings** → Mitigation: Grep for user-visible literals; treat remaining English as bugs to fix before merge.
- **[Risk] Missed light-only classes (`bg-white`, etc.) under dark shell** → Mitigation: Systematic pass over pages/components; smoke-check each route.
- **[Risk] Hydration / `lang` mismatch** → Mitigation: Set `<html lang={locale}>` from server-resolved locale in root layout; invalid cookie falls back to `en`.
- **[Trade-off] Shared links do not encode locale** → Acceptable for private app; revisit if public SEO pages appear.
- **[Trade-off] Locale switch soft-refreshes the page** → Necessary for RSC message reload; still no full navigation to a new path.

## Migration Plan

1. Add `next-intl` wiring and English catalog mirroring current copy.
2. Wire cookie locale + Nav switcher; add `zh-CN` translations.
3. Apply dark shell (`html.dark` + CSS tokens) and migrate hardcoded light utilities.
4. Dark-theme CodeMirror / answer code highlighting.
5. Manual smoke: login, notes, import, ask, settings in both locales under dark UI.
6. Rollback: revert frontend change; cookie is harmless if unused.

## Open Questions

- None blocking implementation; cookie name (`locale` vs `NEXT_LOCALE`) can follow next-intl examples at apply time.
