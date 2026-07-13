# practice-history Specification

## Purpose
Per-note practice/review timestamps (`review_dates`) and the note-detail UI for recording and editing practice history.
## Requirements
### Requirement: Practice review dates on each note
The system SHALL store an ordered list of practice/review timestamps (`review_dates`) on each practice note owned by the user. When a note is created, the system MUST seed `review_dates` with the creation time (or an equivalent single initial timestamp). The owner MUST be able to append a new review timestamp and delete any existing timestamp without deleting the note.

#### Scenario: Seed on create
- **WHEN** a user creates a practice note
- **THEN** the persisted note includes at least one entry in `review_dates` representing the initial practice/入库 time

#### Scenario: Append another practice
- **WHEN** the owner requests to record another practice on an existing note
- **THEN** the system appends a new timestamp to `review_dates` and returns the updated list

#### Scenario: Delete a practice date
- **WHEN** the owner removes one timestamp from `review_dates`
- **THEN** the system persists the list without that timestamp and does not delete the note

#### Scenario: Existing notes after migration
- **WHEN** a note created before `review_dates` existed is loaded after migration
- **THEN** the note has `review_dates` backfilled from `created_at` when the array would otherwise be empty

### Requirement: Practice history on note detail UI
The system SHALL present practice/review dates on the note detail page in the layout region under the pitfalls field (alongside the tags column), using removable chips comparable to tag removal, plus an explicit control to record another practice. Opening the detail page MUST NOT automatically append a review date.

#### Scenario: View and remove chips
- **WHEN** the owner opens a note that has one or more `review_dates`
- **THEN** the dates are shown as chips with a control to remove each date

#### Scenario: Record practice button
- **WHEN** the owner activates the control to record another practice
- **THEN** a new date chip appears (after save or optimistic update per implementation) and the list is persisted

#### Scenario: No auto-record on view
- **WHEN** the owner merely opens the note detail page
- **THEN** `review_dates` is unchanged until they explicitly append or delete

### Requirement: Append review date on dedup merge save
When the owner completes a duplicate-resolve **Save** that merges an incoming draft into an existing practice note, the system SHALL append a new timestamp to that note's `review_dates` as part of the merge persistence (equivalent to recording another practice), in addition to applying the merged field values. This append MUST occur even if the owner did not separately use the note-detail “record practice” control.

#### Scenario: Merge save appends review date
- **WHEN** the owner saves a resolve merge into an existing note
- **THEN** the note's `review_dates` gains one new timestamp and the merged field values are persisted

#### Scenario: Keep as new does not append on old note
- **WHEN** the owner chooses Keep as new from resolve
- **THEN** the previously matched existing note's `review_dates` are unchanged and the new note is seeded per normal create rules
