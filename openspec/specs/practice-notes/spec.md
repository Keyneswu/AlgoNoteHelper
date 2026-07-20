# practice-notes Specification

## Purpose
Practice note catalog owned by each user: entry model, Markdown import, and edit isolation rules.
## Requirements
### Requirement: Practice note entry model
The system SHALL store practice note entries owned by a single user, including at least: title, optional problem statement, approach/notes body, optional code, pitfalls list, tags, difficulty level (1–3, higher = harder), practice/review dates list (`review_dates`), created/updated timestamps, and source metadata when imported from Markdown.

#### Scenario: Create note with sparse fields
- **WHEN** a user saves a practice note that has a title but empty problem statement and empty pitfalls
- **THEN** the system persists the note successfully with empty fields allowed and with `review_dates` seeded for the initial practice time

#### Scenario: User isolation on list
- **WHEN** user A lists practice notes
- **THEN** the system returns only notes owned by user A

#### Scenario: Review dates returned with note
- **WHEN** the owner fetches a practice note
- **THEN** the response includes `review_dates` as an ordered list of timestamps

#### Scenario: Difficulty field persisted
- **WHEN** the owner saves a note with difficulty hard (3)
- **THEN** subsequent reads return difficulty 3 for that note

### Requirement: Markdown import with preview
The system SHALL accept Markdown input, use AI to extract zero or more practice note candidates from available content, and present an import preview where the user can edit, remove, or merge candidates before committing them to their catalog. When similarity matches exist for a candidate, the preview SHALL offer an optional conflict-resolve affordance; unresolved conflicted candidates MUST still be creatable on commit as new notes. Candidates already merged via resolve MUST NOT be inserted again on commit.

#### Scenario: Import file with multiple problems
- **WHEN** a user imports a Markdown document containing multiple problem sections with approaches and optional pitfalls
- **THEN** the preview lists one candidate entry per detected problem with extracted fields filled when present

#### Scenario: Commit after preview confirmation
- **WHEN** the user confirms the import preview
- **THEN** the system creates practice notes only for candidates not already merged into an existing note, for that user only

#### Scenario: Abort import
- **WHEN** the user cancels the import preview
- **THEN** the system does not create any new practice notes from that import

#### Scenario: Optional conflict resolve before commit
- **WHEN** a candidate has similarity matches and the user opens resolve, then Saves a merge into an existing note
- **THEN** subsequent import commit does not create a duplicate row for that candidate

### Requirement: Unique title on note create paths
The system SHALL apply per-user unique title assignment on all create paths that insert a new practice note row (API create, import commit create-as-new, and resolve Keep as new), appending a numeric suffix when the requested title already exists for that user.

#### Scenario: Import create-as-new renames on collision
- **WHEN** import commit creates a note whose title already exists for the user
- **THEN** the created note uses a suffixed unique title

### Requirement: Edit practice notes after import
The system SHALL allow the owner to edit all practice note fields after creation, including tags and difficulty.

#### Scenario: Update difficulty and tags
- **WHEN** the owner sets difficulty to a supported level and updates tags
- **THEN** subsequent Path 1 filters reflect the new values

### Requirement: Admin cannot read other users' notes
The system SHALL NOT grant admin role the ability to list, read, update, or delete another user's practice notes through note APIs or UI.

#### Scenario: Admin opens notes UI
- **WHEN** an admin uses the notes catalog UI
- **THEN** they only see their own notes, same as a normal user

### Requirement: Markdown source preservation
The system SHALL preserve problem statement and approach Markdown source through note creation, update, retrieval, import-compatible payloads, and duplicate-resolution-compatible payloads without converting the stored values to rendered HTML.

#### Scenario: Save and reopen Markdown source
- **WHEN** the owner saves a statement or approach containing Markdown and later reopens the note
- **THEN** the API returns source that can reproduce the saved Markdown structure in the editor and renderer

#### Scenario: Carry Markdown through a compatible workflow
- **WHEN** statement or approach Markdown passes through import preview or duplicate resolution
- **THEN** the workflow carries the Markdown string without converting it to HTML or removing supported Markdown syntax

### Requirement: Ordered single-line pitfalls
The note creation and detail editing experiences SHALL treat pitfalls as an ordered list of non-empty strings that MAY contain internal line breaks, and SHALL submit that list through the existing pitfalls array. Normalization MUST trim items and drop blanks but MUST NOT split one item into multiple items on newline characters.

#### Scenario: Persist independent pitfall items
- **WHEN** the owner saves multiple pitfall blocks including items that contain line breaks
- **THEN** subsequent retrieval returns the same non-empty items in the same order with internal line breaks preserved

#### Scenario: Normalize without splitting lines
- **WHEN** pitfall input for one item contains line breaks in the creation or detail editing experience
- **THEN** the client keeps those line breaks inside that single ordered pitfall item before persistence

#### Scenario: Preserve existing array compatibility
- **WHEN** import, merge, embedding, or Ask grounding consumes a saved note
- **THEN** pitfalls remain available through the existing string-array field without a schema migration

