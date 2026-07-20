## MODIFIED Requirements

### Requirement: Inline Markdown source editing
The system SHALL let the owner activate inline source editing for the statement or approach only through an explicit Edit control. Clicking or focusing the rendered Markdown preview MUST NOT enter edit mode. Ordinary text selection and interactions with links, code controls, and other nested controls in the preview MUST continue to work without entering edit mode.

#### Scenario: Activate via Edit control
- **WHEN** the owner activates the explicit Edit control for a statement or approach
- **THEN** that block is replaced in place by its Markdown source editor

#### Scenario: Preview click does not edit
- **WHEN** the owner clicks a non-interactive area of a rendered statement or approach
- **THEN** the field remains in reading mode

#### Scenario: Interact with rendered content
- **WHEN** the owner selects text or activates a link, code control, or other interactive descendant
- **THEN** the system performs that interaction without entering edit mode

### Requirement: New-note Markdown authoring
The system SHALL let a user author and preview statement and approach Markdown and manage multiline pitfall cards while creating a note, without changing the existing explicit create and duplicate-resolution flow.

#### Scenario: Preview a new note field
- **WHEN** a user edits a new note's statement or approach and selects Preview
- **THEN** the current unsaved source is rendered without creating the note

#### Scenario: Submit a new Markdown note
- **WHEN** a user submits a valid new-note draft
- **THEN** the existing similarity and create flow receives the Markdown source strings and ordered pitfall string array

## ADDED Requirements

### Requirement: Long Markdown field collapse
When a rendered statement or approach exceeds a viewport-relative maximum height of 50vh, the system SHALL collapse the overflow behind an expand control. Content that fits within 50vh MUST display fully without an expand control.

#### Scenario: Short approach stays expanded
- **WHEN** the rendered approach content fits within 50vh
- **THEN** the full content is visible and no collapse control is shown

#### Scenario: Tall approach collapses
- **WHEN** the rendered approach content would exceed 50vh
- **THEN** the field is shown at most 50vh tall with a control to expand and reveal the remainder

### Requirement: Multiline pitfall card grid
The system SHALL present pitfalls as an ordered collection of independent cards on the note detail and new-note pages, placed in a full-width section below the code field and above the tags/difficulty/practice-history meta region. Each card MUST contain an always-visible multiline textarea whose edits update the page draft immediately. On viewports at the `sm` breakpoint and above the cards SHALL arrange two per row; on smaller viewports they SHALL stack one per row. Card actions (at least remove) MUST appear at the bottom of each card. An add control MUST append a new empty or newly authored item. When there are six or more pitfall items, the system SHALL show the first six by default and provide an expand control for the remaining items. Pitfall cards MUST NOT offer AI rewrite actions.

#### Scenario: Page placement
- **WHEN** the owner views the note detail or new-note form
- **THEN** the pitfall section appears below code and above the tags/difficulty and practice-history meta region

#### Scenario: Multiline editing
- **WHEN** the owner types a line break inside a pitfall card textarea
- **THEN** the line break is kept inside that pitfall item in the page draft and does not create a new pitfall item

#### Scenario: Remove and add
- **WHEN** the owner removes a card or adds a new pitfall
- **THEN** only that ordered list change is reflected in the page draft

#### Scenario: Expand beyond six
- **WHEN** the note has more than six pitfall items
- **THEN** only the first six are shown until the owner expands the remainder

## REMOVED Requirements

### Requirement: Independent single-line pitfall blocks
**Reason**: Replaced by multiline always-textarea pitfall card grid; single-line Markdown rendering and Enter-to-add / paste-split behaviors are removed.
**Migration**: Use the new pitfall card grid; existing single-line strings remain valid array items.
