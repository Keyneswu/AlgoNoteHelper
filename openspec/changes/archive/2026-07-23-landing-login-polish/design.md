## Context

AlgoNoteHelper’s authenticated UI on HeroUI v3 is stable. A parallel shadcn migration was abandoned. This change only adds a public landing and light polish to login/setup while leaving the app shell untouched.

## Goals / Non-Goals

**Goals:**

- Brand-first landing at `/` with Path 1 / Path 2 copy and a visual placeholder (no real screenshots yet).
- Soft atmosphere on public surfaces; HeroUI forms for login/setup.
- Cookie locale switcher usable outside AppNav.

**Non-Goals:**

- Migrating to shadcn/ui.
- Changing Notes/Ask/Import/Settings visuals or tokens.
- Public signup.
- Embedding product screenshots on landing.

## Decisions

### D1 — Branch from main, not un-migrate shadcn

Port landing onto HeroUI baseline. Leave any `shadcn-ui-and-landing` branch unmerged.

### D2 — Landing composition C

Hero (brand + headline + supporting + Log in) → dual-path blurb → dashed placeholder. Invite-only hint under CTA.

### D3 — Routing

Server-side: `getNeedsSetup()` → `/setup`; Better Auth `getSession` → `/notes`; else render landing. Proxy matcher stays notes/ask/import/settings only.

### D4 — Link buttons via `buttonVariants`

HeroUI v3 removed `asChild`; style Next.js `Link` with `buttonVariants` from `@heroui/styles`.

## Risks / Trade-offs

- **[Risk] `getNeedsSetup` DB errors** → return `false` and show landing (same as prior design).
- **[Trade-off] Placeholder without screenshots** → intentional; swap assets later.

## Open Questions

None for this scope.
