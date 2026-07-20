## ADDED Requirements

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
The system SHALL let the owner activate inline source editing for the statement or approach from its rendered block while preserving ordinary text selection and interactions with links, code controls, and other nested controls.

#### Scenario: Activate a rendered field
- **WHEN** the owner activates the edit affordance or a non-interactive area of a rendered statement or approach
- **THEN** that block is replaced in place by its Markdown source editor

#### Scenario: Interact with rendered content
- **WHEN** the owner selects text or activates a link, code control, or other interactive descendant
- **THEN** the system performs that interaction without entering edit mode

#### Scenario: Keyboard editing
- **WHEN** a keyboard user focuses an editable Markdown block and presses Enter
- **THEN** the block enters source editing mode and can be cancelled with Escape

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

### Requirement: Independent single-line pitfall blocks
The system SHALL present pitfalls as an ordered collection of independently rendered and editable single-line Markdown items backed by the existing string-array field.

#### Scenario: Add a pitfall with Enter
- **WHEN** the owner enters non-empty text in the pitfall composer and presses Enter
- **THEN** the trimmed text is appended as one unsaved pitfall block

#### Scenario: Paste multiple pitfalls
- **WHEN** the owner pastes text containing multiple non-empty lines into the pitfall composer
- **THEN** the system creates one ordered pitfall item per non-empty line

#### Scenario: Edit one pitfall
- **WHEN** the owner activates and completes editing for one pitfall block
- **THEN** only that item is replaced in the page draft and its array position is retained

#### Scenario: Remove one pitfall
- **WHEN** the owner removes a pitfall block
- **THEN** only that item is removed from the page draft and the remaining order is retained

#### Scenario: Render pitfall Markdown
- **WHEN** a pitfall contains single-line Markdown such as emphasis, a link, or inline code
- **THEN** the system renders that item as sanitized inline Markdown within its own block

### Requirement: New-note Markdown authoring
The system SHALL let a user author and preview statement and approach Markdown and manage pitfall blocks while creating a note, without changing the existing explicit create and duplicate-resolution flow.

#### Scenario: Preview a new note field
- **WHEN** a user edits a new note's statement or approach and selects Preview
- **THEN** the current unsaved source is rendered without creating the note

#### Scenario: Submit a new Markdown note
- **WHEN** a user submits a valid new-note draft
- **THEN** the existing similarity and create flow receives the Markdown source strings and ordered pitfall string array
