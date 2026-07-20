## MODIFIED Requirements

### Requirement: Practice history on note detail UI
The system SHALL present practice/review dates on the note detail page in the right column of the meta region (parallel with tags and difficulty on the left), using removable chips comparable to tag removal, plus an explicit control to record another practice. Opening the detail page MUST NOT automatically append a review date. Practice history MUST NOT occupy the pitfalls section; pitfalls live in their own full-width section above this meta region.

#### Scenario: View and remove chips
- **WHEN** the owner opens a note that has one or more `review_dates`
- **THEN** the dates are shown as chips with a control to remove each date in the right meta column

#### Scenario: Record practice button
- **WHEN** the owner activates the control to record another practice
- **THEN** a new date chip appears (after save or optimistic update per implementation) and the list is persisted

#### Scenario: No auto-record on view
- **WHEN** the owner merely opens the note detail page
- **THEN** `review_dates` is unchanged until they explicitly append or delete

#### Scenario: Parallel with tags and difficulty
- **WHEN** the owner views the note detail meta region
- **THEN** tags and difficulty appear on the left and practice history appears on the right
