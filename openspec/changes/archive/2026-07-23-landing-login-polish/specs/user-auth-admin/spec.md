## ADDED Requirements

### Requirement: Root entry is marketing landing when applicable
After first-run setup is complete, unauthenticated visitors opening `/` SHALL see the marketing landing and reach authentication via Log in → `/login`. The system SHALL NOT use `/` solely as an opaque splash that always immediately redirects to `/login` without presenting product introduction copy.

#### Scenario: Anonymous root shows landing not splash-only
- **WHEN** users already exist, the visitor has no session, and they open `/`
- **THEN** marketing landing content is visible before they navigate to `/login`
