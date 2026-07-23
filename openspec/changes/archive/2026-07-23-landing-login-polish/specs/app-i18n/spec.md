## ADDED Requirements

### Requirement: Landing page strings localized
User-facing static strings on the marketing landing (hero, dual-path intro, placeholder label, public chrome Log in, invite-only hint) SHALL come from locale message catalogs for both `en` and `zh-CN`.

#### Scenario: Chinese landing copy
- **WHEN** the active locale is `zh-CN` and a visitor opens `/`
- **THEN** landing headline and supporting copy render from the Chinese catalog while the brand name remains AlgoNoteHelper

#### Scenario: English landing copy
- **WHEN** the active locale is `en` and a visitor opens `/`
- **THEN** landing copy renders from the English catalog

### Requirement: Locale switcher on public surfaces
The marketing landing (and public login chrome when present) SHALL expose a locale switcher that updates the locale cookie and refreshes copy without requiring AppNav.

#### Scenario: Switch locale from landing
- **WHEN** a visitor selects `zh-CN` from the landing locale control
- **THEN** landing chrome and body copy update to Chinese and the path remains `/`
