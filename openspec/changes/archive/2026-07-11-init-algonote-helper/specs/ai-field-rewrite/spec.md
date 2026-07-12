## ADDED Requirements

### Requirement: Field-level AI rewrite control
The system SHALL provide a per-field action that sends the current textbox content to the user's configured chat model and returns a rewritten version into the same field for the user to review before saving.

#### Scenario: Rewrite problem statement from textbox
- **WHEN** the user clicks AI rewrite on the problem statement field containing pasted source text
- **THEN** the system returns cleaned text into that field without auto-saving until the user saves the note

### Requirement: Format-only rewrite semantics
The system SHALL instruct the rewrite model to clean formatting only (whitespace, headings, lists, removal of irrelevant UI chrome) and MUST NOT change problem meaning, add constraints, or invent details that were not present in the input.

#### Scenario: Rewrite does not invent constraints
- **WHEN** the input problem statement omits explicit constraints
- **THEN** the rewritten output does not add new numerical constraints or requirements not present in the input

### Requirement: Rewrite requires chat credentials
The system SHALL reject field rewrite requests when the current user has no valid chat API configuration.

#### Scenario: Missing chat key
- **WHEN** a user requests field rewrite without a configured chat API key
- **THEN** the system returns an error directing them to configure chat credentials
