## MODIFIED Requirements

### Requirement: Practice note entry model
The system SHALL store practice note entries owned by a single user, including at least: title, optional problem statement, approach/notes body, optional code, pitfalls list, tags, importance level, practice/review dates list (`review_dates`), created/updated timestamps, and source metadata when imported from Markdown.

#### Scenario: Create note with sparse fields
- **WHEN** a user saves a practice note that has a title but empty problem statement and empty pitfalls
- **THEN** the system persists the note successfully with empty fields allowed and with `review_dates` seeded for the initial practice time

#### Scenario: User isolation on list
- **WHEN** user A lists practice notes
- **THEN** the system returns only notes owned by user A

#### Scenario: Review dates returned with note
- **WHEN** the owner fetches a practice note
- **THEN** the response includes `review_dates` as an ordered list of timestamps
