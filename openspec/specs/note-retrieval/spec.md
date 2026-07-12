# note-retrieval Specification

## Purpose
TBD - created by archiving change init-algonote-helper. Update Purpose after archive.
## Requirements
### Requirement: Path 1 structured filter
The system SHALL allow users to unlock practice notes by filtering on structured metadata including tags, date/time range, and importance, returning a list of matching notes owned by the current user.

#### Scenario: Filter by tag and importance
- **WHEN** a user filters for tag `dp` and importance at or above a chosen level
- **THEN** the system returns only that user's notes matching both criteria

#### Scenario: Filter by date range
- **WHEN** a user filters notes updated or created within a date range
- **THEN** the system returns only notes in that range for the current user

### Requirement: Path 2 retrieve then list then answer
The system SHALL support natural-language questions by (1) retrieving relevant practice notes for the current user, (2) listing those notes to the user, and (3) answering or summarizing using only the listed notes.

#### Scenario: Scenario-style semantic question
- **WHEN** a user asks which of their notes relate to a scenario such as reservoir water / draining water
- **THEN** the system first lists the relevant notes it retrieved and then provides an answer or summary grounded in those notes

#### Scenario: Empty retrieval
- **WHEN** semantic retrieval finds no relevant notes for the user
- **THEN** the system reports that no relevant notes were found and does not invent practice notes

#### Scenario: Answer grounded only on list
- **WHEN** the system produces a Path 2 answer
- **THEN** the answer MUST be based on the notes included in the preceding list and MUST NOT present external problem knowledge as if it were the user's notes

### Requirement: Entry-level embeddings
The system SHALL embed each practice note as a single retrieval unit using title, problem statement, approach, and pitfalls text, and SHALL exclude primary code bodies from the default embedding document unless explicitly configured later.

#### Scenario: Embed after note save
- **WHEN** a user creates or updates embeddable fields on a note and embedding credentials are configured
- **THEN** the system updates that note's vector so Path 2 can retrieve it

