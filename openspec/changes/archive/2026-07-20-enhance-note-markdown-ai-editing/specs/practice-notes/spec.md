## ADDED Requirements

### Requirement: Markdown source preservation
The system SHALL preserve problem statement and approach Markdown source through note creation, update, retrieval, import-compatible payloads, and duplicate-resolution-compatible payloads without converting the stored values to rendered HTML.

#### Scenario: Save and reopen Markdown source
- **WHEN** the owner saves a statement or approach containing Markdown and later reopens the note
- **THEN** the API returns source that can reproduce the saved Markdown structure in the editor and renderer

#### Scenario: Carry Markdown through a compatible workflow
- **WHEN** statement or approach Markdown passes through import preview or duplicate resolution
- **THEN** the workflow carries the Markdown string without converting it to HTML or removing supported Markdown syntax

### Requirement: Ordered single-line pitfalls
The note creation and detail editing experiences SHALL treat pitfalls as an ordered list of non-empty single-line strings and SHALL submit that list through the existing pitfalls array.

#### Scenario: Persist independent pitfall items
- **WHEN** the owner saves multiple pitfall blocks
- **THEN** subsequent retrieval returns the same non-empty items in the same order

#### Scenario: Normalize multiline pitfall input
- **WHEN** pitfall input contains line breaks in the creation or detail editing experience
- **THEN** the client converts each non-empty trimmed line into a separate ordered pitfall item before persistence

#### Scenario: Preserve existing array compatibility
- **WHEN** import, merge, embedding, or Ask grounding consumes a saved note
- **THEN** pitfalls remain available through the existing string-array field without a schema migration
