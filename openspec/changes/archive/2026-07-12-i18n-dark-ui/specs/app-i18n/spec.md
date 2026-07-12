## ADDED Requirements

### Requirement: Supported locales and default
The frontend SHALL support UI locales `en` and `zh-CN`, and SHALL use `en` when no valid locale preference is present.

#### Scenario: First visit without cookie
- **WHEN** a user opens the app with no locale cookie set
- **THEN** the UI renders in English and the document language reflects English

#### Scenario: Invalid locale cookie
- **WHEN** the locale cookie contains an unsupported value
- **THEN** the UI falls back to English

### Requirement: Cookie-persisted locale without URL prefixes
The frontend SHALL resolve the active locale from a cookie (not from a URL locale segment) and SHALL NOT require i18n middleware or `/[locale]/...` routes for page navigation.

#### Scenario: Pathnames remain locale-agnostic
- **WHEN** a user navigates to notes, ask, settings, or other app pages
- **THEN** pathnames do not include an `en` or `zh-CN` prefix solely for localization

#### Scenario: Preference survives reload
- **WHEN** the user has selected `zh-CN` and reloads the browser
- **THEN** the UI continues to render in Chinese

### Requirement: Fast locale switch from app chrome
The frontend SHALL provide a control in the primary app navigation that switches between `en` and `zh-CN` by updating the locale cookie and refreshing the current view without changing the pathname for locale purposes.

#### Scenario: Switch to Chinese
- **WHEN** the user selects Chinese from the language control while on `/notes`
- **THEN** chrome and page copy update to Chinese and the path remains `/notes`

#### Scenario: Switch back to English
- **WHEN** the user selects English from the language control
- **THEN** chrome and page copy update to English

### Requirement: Translated application chrome and pages
User-facing static UI strings on shipped frontend pages and shared chrome (navigation, login, setup, notes, import, ask, settings, common actions/errors shown in UI) SHALL come from locale message catalogs for both supported locales.

#### Scenario: Navigation labels follow locale
- **WHEN** the active locale is `zh-CN`
- **THEN** primary navigation labels render from the Chinese catalog

#### Scenario: Brand name stable
- **WHEN** the UI is shown in either supported locale
- **THEN** the product name AlgoNoteHelper remains AlgoNoteHelper

### Requirement: User content not auto-translated
The system SHALL NOT translate user-authored note bodies, tags entered by the user, or model-generated answer text as part of locale switching.

#### Scenario: Note body unchanged after locale switch
- **WHEN** the user switches locale while viewing a note
- **THEN** the stored note content text is unchanged
