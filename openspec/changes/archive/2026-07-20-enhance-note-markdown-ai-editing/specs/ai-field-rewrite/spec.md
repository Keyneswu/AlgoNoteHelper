## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Validated field-operation contract
The system SHALL validate the rewrite field and operation as an allowed combination before calling the model and SHALL reject unsupported combinations.

#### Scenario: Invoke a supported operation
- **WHEN** a request targets statement formatting, approach organization, pitfall clarification or shortening, or a supported custom operation
- **THEN** the system applies the corresponding server-owned field policy

#### Scenario: Request generic code rewrite
- **WHEN** a client requests generic prose rewrite behavior for the code field
- **THEN** the system rejects the request without calling the model

#### Scenario: Request an invalid combination
- **WHEN** a client sends an operation that is not allowed for its target field
- **THEN** the system returns a validation error without calling the model

### Requirement: Field-specific rewrite semantics
The system SHALL use distinct server-owned rewrite policies for problem statements, existing approaches, and individual pitfalls and SHALL provide only context relevant to grounding the selected target.

#### Scenario: Organize an existing approach
- **WHEN** the user invokes Organize approach for non-empty approach content
- **THEN** the model reorganizes that existing approach using the note context without silently replacing it with an unrelated algorithm

#### Scenario: Keep approach generation distinct
- **WHEN** the approach is empty and the user requests generation from a sufficiently complete statement
- **THEN** the system uses the approach-generation behavior rather than treating generation as a rewrite of existing content

#### Scenario: Clarify one pitfall
- **WHEN** the user invokes Clarify for one pitfall item
- **THEN** the returned candidate targets only that item, remains single-line, and uses note context only to explain the existing pitfall

#### Scenario: Shorten one pitfall
- **WHEN** the user invokes Shorten for one pitfall item
- **THEN** the returned candidate preserves the warning's meaning in a more concise single-line form

### Requirement: Prompted rewrite
The system SHALL accept an optional bounded user instruction for supported rewrite targets while treating the immutable server-owned field policy as authoritative.

#### Scenario: Follow a compatible custom instruction
- **WHEN** the user asks to reorganize a statement or approach in a way consistent with the field policy
- **THEN** the candidate follows that instruction while retaining the field's grounding and output guarantees

#### Scenario: Custom instruction requests invention
- **WHEN** a custom statement instruction asks the model to add constraints or facts not present in the source
- **THEN** the candidate does not introduce those unsupported facts

#### Scenario: Custom instruction exceeds its limit
- **WHEN** a client submits an instruction longer than the configured request limit
- **THEN** the system rejects the request before calling the model

### Requirement: Stale AI result protection
The system SHALL associate each AI candidate with the target snapshot used to request it and MUST NOT silently apply a candidate over a newer target value.

#### Scenario: Target changes during rewrite
- **WHEN** the user changes the target after starting a rewrite and the earlier response later arrives
- **THEN** the system marks or discards the response as stale and does not overwrite the newer draft

#### Scenario: Undo an applied candidate
- **WHEN** the user applies a current AI candidate and then selects Undo before saving
- **THEN** the target returns to its pre-application draft value
