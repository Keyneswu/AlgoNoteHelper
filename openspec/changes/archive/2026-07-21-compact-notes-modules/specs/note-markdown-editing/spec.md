## ADDED Requirements

### Requirement: Shared create and detail Markdown editor shell
The system SHALL provide the inline Markdown editing experience for problem statement and approach on the new-note page and the note-detail page through one shared editor form component, so both pages keep the same field structure and AI rewrite affordances without maintaining separate form implementations.

#### Scenario: New note uses shared editor form
- **WHEN** the owner opens the new-note page
- **THEN** statement and approach inline Markdown editing (including explicit Edit control and AI rewrite actions) are rendered by the shared editor form

#### Scenario: Note detail uses shared editor form
- **WHEN** the owner opens an existing note detail page
- **THEN** statement and approach inline Markdown editing (including explicit Edit control and AI rewrite actions) are rendered by the same shared editor form used on the new-note page
