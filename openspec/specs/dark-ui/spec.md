# dark-ui Specification

## Purpose
Fixed dark visual style for the AlgoNoteHelper frontend (no light / dark / system theme toggle).

## Requirements
### Requirement: Fixed dark visual style
The frontend SHALL present a single dark visual style for the application shell and pages. The system SHALL NOT expose a user-facing light / dark / system color-mode switcher.

#### Scenario: App loads in dark style
- **WHEN** a user opens any primary app page
- **THEN** the page background and primary surfaces use a dark palette suitable for extended reading

#### Scenario: No theme mode control
- **WHEN** a user inspects the app navigation and settings for appearance controls
- **THEN** there is no control to select light, dark, or system color mode

### Requirement: Consistent dark surfaces across UI layers
Custom layout styles and HeroUI-backed controls SHALL render consistently on the dark palette (including borders, cards, and form fields used on primary pages).

#### Scenario: Navigation and cards on dark background
- **WHEN** a user views the notes list with navigation chrome
- **THEN** the nav, cards, and surrounding page background remain dark-compatible without light “holes” such as white full-page panels

### Requirement: Dark-compatible code and answer rendering
Code editors and streamed/markdown answer surfaces that embed code SHALL use dark-appropriate highlighting so they match the surrounding dark UI.

#### Scenario: Code field matches shell
- **WHEN** a user opens a note editor that includes a code field
- **THEN** the editor chrome and syntax highlighting are dark-themed

#### Scenario: Ask answer code blocks
- **WHEN** an Ask answer includes a fenced code block
- **THEN** the code block renders with dark-appropriate styling
