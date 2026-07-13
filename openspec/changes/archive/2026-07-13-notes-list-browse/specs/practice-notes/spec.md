## MODIFIED Requirements

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

### Requirement: Edit practice notes after import
The system SHALL allow the owner to edit all practice note fields after creation, including tags and difficulty.

#### Scenario: Update difficulty and tags
- **WHEN** the owner sets difficulty to a supported level and updates tags
- **THEN** subsequent Path 1 filters reflect the new values
