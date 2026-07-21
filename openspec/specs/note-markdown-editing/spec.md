# note-markdown-editing Specification

## Purpose
Markdown-based reading and inline editing experience for practice note fields (problem statement, approach, pitfalls) across the note detail and new-note pages.
## Requirements
### Requirement: Sanitized Markdown note reading
The system SHALL render an existing note's problem statement and approach as sanitized static Markdown by default, including headings, lists, links, inline code, and fenced code blocks, without mutating the stored source.

#### Scenario: Open an existing Markdown note
- **WHEN** the owner opens a note whose statement or approach contains Markdown
- **THEN** the system displays the rendered Markdown rather than an always-visible source textarea

#### Scenario: Render potentially unsafe Markdown
- **WHEN** stored Markdown contains unsafe HTML, attributes, or URL protocols
- **THEN** the rendered note removes or neutralizes the unsafe content before displaying it

#### Scenario: Open legacy plain text
- **WHEN** the owner opens an existing note containing plain text that has not been formatted as Markdown
- **THEN** the system renders the text without automatically rewriting or saving it

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

### Requirement: Field preview and cancellation
The system SHALL provide a rendered preview for the active Markdown source editor and SHALL distinguish completing a field edit from cancelling it.

#### Scenario: Preview unsaved Markdown
- **WHEN** the owner changes Markdown source and selects Preview
- **THEN** the system renders the current unsaved field source through the same sanitized renderer used by reading mode

#### Scenario: Cancel one field edit
- **WHEN** the owner cancels an active field edit
- **THEN** the field returns to the value it held when that editing session began without changing other page-draft fields

#### Scenario: Complete one field edit
- **WHEN** the owner completes an active field edit
- **THEN** the changed value remains in the page draft and the field returns to rendered reading mode without being persisted

### Requirement: Explicit whole-note draft persistence
The system SHALL track a saved baseline separately from the page draft and SHALL expose visible Save and Discard actions whenever the existing-note draft differs from its saved baseline.

#### Scenario: Complete an inline edit
- **WHEN** the owner completes an inline edit that changes note content
- **THEN** a persistent dirty-state control remains visible until the owner saves or discards the page draft

#### Scenario: Save the page draft
- **WHEN** the owner selects Save and the note update succeeds
- **THEN** the system persists the complete draft and adopts the returned note as the new saved baseline

#### Scenario: Discard all page changes
- **WHEN** the owner selects Discard while the page is dirty
- **THEN** all unsaved fields return to the saved baseline

### Requirement: New-note Markdown authoring
The system SHALL let a user author and preview statement and approach Markdown and manage multiline pitfall cards while creating a note, without changing the existing explicit create and duplicate-resolution flow.

#### Scenario: Preview a new note field
- **WHEN** a user edits a new note's statement or approach and selects Preview
- **THEN** the current unsaved source is rendered without creating the note

#### Scenario: Submit a new Markdown note
- **WHEN** a user submits a valid new-note draft
- **THEN** the existing similarity and create flow receives the Markdown source strings and ordered pitfall string array

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

### Requirement: Shared create and detail Markdown editor shell
The system SHALL provide the inline Markdown editing experience for problem statement and approach on the new-note page and the note-detail page through one shared editor form component, so both pages keep the same field structure and AI rewrite affordances without maintaining separate form implementations.

#### Scenario: New note uses shared editor form
- **WHEN** the owner opens the new-note page
- **THEN** statement and approach inline Markdown editing (including explicit Edit control and AI rewrite actions) are rendered by the shared editor form

#### Scenario: Note detail uses shared editor form
- **WHEN** the owner opens an existing note detail page
- **THEN** statement and approach inline Markdown editing (including explicit Edit control and AI rewrite actions) are rendered by the same shared editor form used on the new-note page

