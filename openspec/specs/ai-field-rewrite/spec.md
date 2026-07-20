# ai-field-rewrite Specification

## Purpose
TBD - created by archiving change init-algonote-helper. Update Purpose after archive.
## Requirements
### Requirement: Field-level AI rewrite control
The system SHALL provide named, validated per-field AI operations that submit the selected target content and permitted note context to the user's configured chat model and return candidate content for review before it can enter the page draft.

#### Scenario: Format a problem statement
- **WHEN** the user invokes Format as Markdown for a non-empty problem statement
- **THEN** the system returns a statement candidate associated with that field and leaves the current draft unchanged until the user applies it

#### Scenario: Apply an AI candidate
- **WHEN** the user accepts a reviewed candidate
- **THEN** the candidate replaces only its target in the unsaved page draft and the note is not persisted until the user saves it

#### Scenario: Discard an AI candidate
- **WHEN** the user discards a reviewed candidate
- **THEN** the current page draft remains unchanged

### Requirement: Format-only rewrite semantics
The system SHALL format problem statements as faithful Markdown by cleaning whitespace, adding structure such as headings and lists, and fencing preformatted examples when needed, while preserving the source language and MUST NOT change problem meaning, add constraints, or invent details absent from the target text.

#### Scenario: Rewrite does not invent constraints
- **WHEN** the input problem statement omits explicit constraints
- **THEN** the formatted candidate does not add new numerical constraints or requirements

#### Scenario: Preserve an ASCII example
- **WHEN** a problem statement contains a matrix, tree, or other spacing-dependent example
- **THEN** the formatted candidate preserves the example in a Markdown form that retains its layout

#### Scenario: Preserve source language
- **WHEN** the input problem statement is written in Chinese or English
- **THEN** the formatted candidate remains in that language unless translation is introduced by a future explicitly separate capability

### Requirement: Rewrite requires chat credentials
The system SHALL reject field rewrite requests when the current user has no valid chat API configuration.

#### Scenario: Missing chat key
- **WHEN** a user requests field rewrite without a configured chat API key
- **THEN** the system returns an error directing them to configure chat credentials

### Requirement: Validated field-operation contract
The system SHALL validate the rewrite field and operation as an allowed combination before calling the model and SHALL reject unsupported combinations. Allowed combinations are statement `format_markdown` and approach `organize` only.

#### Scenario: Invoke a supported operation
- **WHEN** a request targets statement formatting or approach organization
- **THEN** the system applies the corresponding server-owned field policy

#### Scenario: Request generic code rewrite
- **WHEN** a client requests generic prose rewrite behavior for the code field
- **THEN** the system rejects the request without calling the model

#### Scenario: Request an invalid combination
- **WHEN** a client sends an operation that is not allowed for its target field (including custom, pitfall, or generate-approach style requests)
- **THEN** the system returns a validation error without calling the model

### Requirement: Field-specific rewrite semantics
The system SHALL use distinct server-owned rewrite policies for problem statements and existing approaches and SHALL provide only context relevant to grounding the selected target. The system MUST NOT expose pitfall rewrite operations or approach generation through the rewrite API.

#### Scenario: Organize an existing approach
- **WHEN** the user invokes Organize approach for non-empty approach content
- **THEN** the model reorganizes that existing approach using the note context without silently replacing it with an unrelated algorithm

#### Scenario: Format a problem statement remains available
- **WHEN** the user invokes Format for a non-empty problem statement
- **THEN** the system returns a statement candidate associated with that field and leaves the current draft unchanged until the user applies it

### Requirement: Stale AI result protection
The system SHALL associate each AI candidate with the target snapshot used to request it and MUST NOT silently apply a candidate over a newer target value.

#### Scenario: Target changes during rewrite
- **WHEN** the user changes the target after starting a rewrite and the earlier response later arrives
- **THEN** the system marks or discards the response as stale and does not overwrite the newer draft

#### Scenario: Undo an applied candidate
- **WHEN** the user applies a current AI candidate and then selects Undo before saving
- **THEN** the target returns to its pre-application draft value

### Requirement: Pending indicator for rewrite actions
While a rewrite request is in flight, the system SHALL show a visible spinning pending indicator on or beside the invoked action control and MUST disable concurrent rewrite actions for that panel until the request completes or fails.

#### Scenario: Spinner while formatting
- **WHEN** the user invokes Format and the rewrite request has not yet returned
- **THEN** the Format control shows a spinning pending indicator and other rewrite actions in that panel are disabled

