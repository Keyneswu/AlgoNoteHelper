# practice-notes Specification

## Purpose
TBD - created by archiving change init-algonote-helper. Update Purpose after archive.
## Requirements
### Requirement: Practice note entry model
The system SHALL store practice note entries owned by a single user, including at least: title, optional problem statement, approach/notes body, optional code, pitfalls list, tags, importance level, created/updated timestamps, and source metadata when imported from Markdown.

#### Scenario: Create note with sparse fields
- **WHEN** a user saves a practice note that has a title but empty problem statement and empty pitfalls
- **THEN** the system persists the note successfully with empty fields allowed

#### Scenario: User isolation on list
- **WHEN** user A lists practice notes
- **THEN** the system returns only notes owned by user A

### Requirement: Markdown import with preview
The system SHALL accept Markdown input, use AI to extract zero or more practice note candidates from available content, and present an import preview where the user can edit, remove, or merge candidates before committing them to their catalog.

#### Scenario: Import file with multiple problems
- **WHEN** a user imports a Markdown document containing multiple problem sections with approaches and optional pitfalls
- **THEN** the preview lists one candidate entry per detected problem with extracted fields filled when present

#### Scenario: Commit after preview confirmation
- **WHEN** the user confirms the import preview
- **THEN** the system creates the corresponding practice notes for that user only

#### Scenario: Abort import
- **WHEN** the user cancels the import preview
- **THEN** the system does not create any new practice notes from that import

### Requirement: Edit practice notes after import
The system SHALL allow the owner to edit all practice note fields after creation, including tags and importance.

#### Scenario: Update importance and tags
- **WHEN** the owner sets importance to a supported level and updates tags
- **THEN** subsequent Path 1 filters reflect the new values

### Requirement: Admin cannot read other users' notes
The system SHALL NOT grant admin role the ability to list, read, update, or delete another user's practice notes through note APIs or UI.

#### Scenario: Admin opens notes UI
- **WHEN** an admin uses the notes catalog UI
- **THEN** they only see their own notes, same as a normal user

