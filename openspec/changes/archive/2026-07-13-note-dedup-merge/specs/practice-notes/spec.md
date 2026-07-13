## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Unique title on note create paths
The system SHALL apply per-user unique title assignment on all create paths that insert a new practice note row (API create, import commit create-as-new, and resolve Keep as new), appending a numeric suffix when the requested title already exists for that user.

#### Scenario: Import create-as-new renames on collision
- **WHEN** import commit creates a note whose title already exists for the user
- **THEN** the created note uses a suffixed unique title
