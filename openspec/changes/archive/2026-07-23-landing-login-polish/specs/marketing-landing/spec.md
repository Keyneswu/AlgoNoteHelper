## ADDED Requirements

### Requirement: Public marketing home at root
The frontend SHALL render a public marketing landing at `/` for visitors who are not signed in and when first-run setup is not required. The landing SHALL use a brand-first hero: product name AlgoNoteHelper as the dominant title signal, one headline, one short supporting sentence, and a primary Log in CTA. The landing SHALL NOT include a public Sign up CTA.

#### Scenario: Anonymous visitor opens root
- **WHEN** a visitor with no session opens `/` and the system does not need first-run setup
- **THEN** the landing page is shown with brand, headline, supporting copy, and a Log in control that navigates to `/login`

#### Scenario: No public signup on landing
- **WHEN** a visitor views the landing page
- **THEN** there is no control that starts a public self-registration flow

### Requirement: Root routing for session and setup
When `/` is requested, the system SHALL redirect to `/setup` if first-run setup is required, redirect to `/notes` if the visitor has an authenticated session, and otherwise render the marketing landing.

#### Scenario: Logged-in user hits root
- **WHEN** a signed-in user opens `/`
- **THEN** they are redirected to `/notes` without needing to use the landing CTA

#### Scenario: Empty database hits root
- **WHEN** no users exist and a visitor opens `/`
- **THEN** they are redirected to `/setup`

### Requirement: Dual-path intro and visual placeholder
Below the hero, the landing SHALL present a light introduction to Path 1 (structured filter) and Path 2 (Ask), and SHALL reserve a fixed-aspect visual placeholder slot for a future product image. This change MUST NOT embed real product screenshots in that slot.

#### Scenario: Paths described without screenshots
- **WHEN** a visitor views the landing below the hero
- **THEN** Path 1 and Path 2 are described in UI copy and a visual placeholder region is present without a committed product screenshot asset

### Requirement: Public landing chrome
The landing SHALL provide minimal public chrome that includes a locale switcher for `en` and `zh-CN` and access to Log in, without the authenticated AppNav links.

#### Scenario: Locale on landing
- **WHEN** a visitor switches locale from the landing chrome
- **THEN** landing copy updates to the selected locale and the path remains `/`
