## 1. Landing + i18n

- [x] 1.1 Add `setup-status.ts` and `landing.*` message keys (`en` / `zh-CN`)
- [x] 1.2 Replace `/` splash with HeroUI landing (routing, composition C, placeholder)
- [x] 1.3 Confirm `proxy.ts` leaves `/` public

## 2. Public polish

- [x] 2.1 Add `.atmosphere` to `globals.css` (keep HeroUI styles)
- [x] 2.2 Polish login and setup with atmosphere + HeroUI Card + locale chrome

## 3. Verify

- [x] 3.1 Frontend lint / tests
- [x] 3.2 Smoke: landing logged-out, login, notes still HeroUI (code-level: HeroUI deps intact; landing/login use atmosphere)
