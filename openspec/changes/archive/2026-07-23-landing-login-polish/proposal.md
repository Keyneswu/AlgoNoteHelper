## Why

`/` was only a splash that bounced visitors to `/login` or `/notes`, so the product never introduced itself. A full HeroUI → shadcn migration was abandoned as too disruptive; we keep the working HeroUI app UI and add a marketing landing plus a polished public login/setup surface instead.

**Supersedes / abandons:** the incomplete `shadcn-ui-and-landing` change (do not merge that branch).

## What Changes

- Replace `/` splash with a public marketing landing (composition C: brand hero, Path 1 / Path 2 intro, visual placeholder, Log in only — no Sign up).
- Route `/`: `needsSetup` → `/setup`; session → `/notes`; else landing.
- Add `.atmosphere` soft glow for public pages (landing, login, setup).
- Polish login and setup with atmosphere + clearer HeroUI card chrome; optional locale switcher on those pages.
- Keep Notes / Ask / Import / Settings / AppNav on existing **HeroUI** — no design-system swap.

## Capabilities

### New Capabilities

- `marketing-landing`: Public `/` home for logged-out users when setup is not required.

### Modified Capabilities

- `app-i18n`: Landing strings in `en` + `zh-CN`; locale control available on public landing/login chrome.
- `user-auth-admin`: Root entry becomes landing when applicable (not splash-only → login).

## Impact

- Frontend: `page.tsx`, login/setup pages, `globals.css` (additive `.atmosphere`), message catalogs, new `setup-status.ts`.
- `proxy.ts` unchanged (`/` already public).
- No API / DB / dependency changes; HeroUI remains.
