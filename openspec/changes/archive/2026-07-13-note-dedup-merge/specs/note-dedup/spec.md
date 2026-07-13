## ADDED Requirements

### Requirement: Similarity check for incoming drafts
The system SHALL compare an incoming practice-note draft (from import candidates or New Note) against the current user's existing notes using embedding similarity and return up to three matches above a server-defined threshold, scoped to that user only. When embedding configuration is missing, unverified, or the similarity query fails, the system MUST return an empty match list and MUST NOT block create or import.

#### Scenario: Top matches returned
- **WHEN** a user submits a draft whose title and statement are highly similar to existing owned notes that have embeddings
- **THEN** the system returns at most three matching notes with identifiers, titles, and similarity scores ordered by score

#### Scenario: Soft-fail without embeddings
- **WHEN** the user has no verified embedding configuration
- **THEN** the similarity response is empty and create/import may proceed without conflict signaling

#### Scenario: User isolation
- **WHEN** user A requests similar notes for a draft
- **THEN** matches include only notes owned by user A

### Requirement: Soft conflict on import preview
The system SHALL, after import extract (and when similarity matches exist for a candidate), surface a conflict affordance on that candidate row (for example a Solve control placed before Remove). The affordance MUST be optional: if the user never opens resolve for that candidate, import commit MUST treat the candidate as create-as-new.

#### Scenario: Solve affordance shown
- **WHEN** extract yields a candidate with one or more similarity matches
- **THEN** the import preview shows a conflict control for that candidate without requiring the user to resolve it before commit

#### Scenario: Ignore conflict on commit
- **WHEN** the user confirms import without resolving a conflicted candidate
- **THEN** the system creates a new practice note for that candidate (subject to unique-title rules)

### Requirement: Soft conflict on New Note save
The system SHALL run similarity when the user saves a new practice note. If matches exist, the system MUST navigate the user into the shared resolve experience instead of immediately creating the note. If no matches exist, the system MUST create the note as today (subject to unique-title rules). Editing an existing note on the note detail page MUST NOT enter this conflict flow.

#### Scenario: Save with matches
- **WHEN** the user saves a new note and similarity returns matches
- **THEN** the UI opens the shared resolve view with the draft as incoming and does not create a note until Save or Keep as new completes

#### Scenario: Save without matches
- **WHEN** the user saves a new note and similarity returns no matches
- **THEN** the system creates the note without opening resolve

#### Scenario: Detail edit excluded
- **WHEN** the owner saves changes on an existing note detail page
- **THEN** the system does not run the New Note conflict resolve flow

### Requirement: Shared side-by-side resolve experience
The system SHALL provide a shared resolve UI (routed under `/notes/resolve` and/or `/import/resolve` using one component) where the user may select among up to three similar existing notes as the merge target. The UI MUST show incoming content as reference and the existing note as an editable result canvas. Empty existing fields MUST be prefilled from incoming. Non-empty existing fields MUST remain as the existing value until the user edits them or runs AI merge. The UI MUST offer Reverse to restore the original existing field snapshot from resolve entry. The only completion actions SHALL be **Save** (merge into the selected existing note) and **Keep as new** (create a new note). Completing either action MUST return the user to the originating Import or New Note task.

#### Scenario: Prefill empty fields
- **WHEN** the selected existing note has an empty approach and incoming has a non-empty approach
- **THEN** the editable result canvas shows the incoming approach for that field

#### Scenario: Reverse after edit
- **WHEN** the user changes a field on the existing canvas (manually or via AI merge) and then activates Reverse for that field
- **THEN** the field returns to the existing value captured when resolve opened

#### Scenario: Save merges and exits
- **WHEN** the user activates Save on resolve
- **THEN** the selected existing note is updated with the canvas field values, a review timestamp is appended, no new note row is created for that draft, and the UI returns to the originating task

#### Scenario: Keep as new exits
- **WHEN** the user activates Keep as new
- **THEN** a new practice note is created from the incoming draft (with unique-title handling), the existing note is unchanged, and the UI returns to the originating task

### Requirement: AI merge of conflicting field text
The system SHALL provide an AI merge action on resolve for fields where both existing and incoming text are non-empty. The merge MUST send both versions to the user's configured chat model with instructions to produce one combined field value biased toward preserving incoming content when the versions conflict. AI merge MUST NOT auto-persist the note; the result appears in the editable canvas for review. Reverse MUST still restore the pre-resolve existing snapshot. Format-only field rewrite semantics MUST NOT be used as the merge prompt.

#### Scenario: AI merge into canvas
- **WHEN** the user runs AI merge on a field with both existing and incoming text
- **THEN** the canvas field is replaced with the model output without saving the note until Save or Keep as new

#### Scenario: AI merge requires chat config
- **WHEN** the user requests AI merge without valid chat credentials
- **THEN** the system returns an error and leaves the canvas field unchanged

### Requirement: Per-user unique titles on create
The system SHALL enforce that practice note titles are unique per owning user when creating a note (including import commit create-as-new and Keep as new). If the requested title already exists for that user, the system MUST assign a free title by appending a numeric suffix such as ` (2)`, ` (3)`, and so on.

#### Scenario: Suffix on collision
- **WHEN** the user creates a note titled `两数之和` and that title already exists for the user
- **THEN** the persisted title is a distinct variant such as `两数之和 (2)`

#### Scenario: Uniqueness scoped to owner
- **WHEN** user A and user B both create a note with the same title string
- **THEN** both creates succeed without cross-user conflict
