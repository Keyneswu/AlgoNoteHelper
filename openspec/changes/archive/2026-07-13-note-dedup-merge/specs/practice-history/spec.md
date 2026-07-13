## ADDED Requirements

### Requirement: Append review date on dedup merge save
When the owner completes a duplicate-resolve **Save** that merges an incoming draft into an existing practice note, the system SHALL append a new timestamp to that note's `review_dates` as part of the merge persistence (equivalent to recording another practice), in addition to applying the merged field values. This append MUST occur even if the owner did not separately use the note-detail “record practice” control.

#### Scenario: Merge save appends review date
- **WHEN** the owner saves a resolve merge into an existing note
- **THEN** the note's `review_dates` gains one new timestamp and the merged field values are persisted

#### Scenario: Keep as new does not append on old note
- **WHEN** the owner chooses Keep as new from resolve
- **THEN** the previously matched existing note's `review_dates` are unchanged and the new note is seeded per normal create rules
