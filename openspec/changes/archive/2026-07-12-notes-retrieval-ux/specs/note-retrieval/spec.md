## MODIFIED Requirements

### Requirement: Path 1 structured filter
The system SHALL allow users to unlock practice notes by filtering on structured metadata: optional title substring match (case-insensitive), optional tags with **AND** semantics (note tags must contain every selected tag), and optional importance membership (note importance must be one of the selected levels). The system SHALL return only matching notes owned by the current user. Date/time range MUST NOT be required as a Path 1 filter axis in the product UI.

#### Scenario: Filter by title substring
- **WHEN** a user searches with title query `substring`
- **THEN** the system returns only that user's notes whose title contains that substring case-insensitively

#### Scenario: Filter by multiple tags with AND
- **WHEN** a user selects tags `dp` and `array`
- **THEN** the system returns only notes whose tags include both `dp` and `array`

#### Scenario: Filter by importance membership
- **WHEN** a user selects importance levels medium and high
- **THEN** the system returns only notes with importance medium or high (not low)

#### Scenario: Empty tag selection
- **WHEN** a user applies filters with no tags selected
- **THEN** the system does not constrain results by tags

#### Scenario: Combined title, tags, and importance
- **WHEN** a user commits a title query, one or more tags, and a non-empty importance selection
- **THEN** the system returns only notes matching all active predicates

## ADDED Requirements

### Requirement: Notes list filter interaction
The Notes catalog UI SHALL use preset tag multi-select (not free-text comma entry as the primary control), importance multi-select defaulting to all supported levels with no “Any” option, and a title search field. Title and tag changes MUST apply only when the user presses Enter or activates Search/Apply. Changing the importance selection MUST refetch using the last committed title and tag query without waiting for Search. The Notes list UI MUST NOT expose created/updated date-range filter controls.

#### Scenario: Search commits title and tags
- **WHEN** the user edits the title field and selected tags then presses Enter or Search
- **THEN** the list reloads with those title and tag predicates committed

#### Scenario: Importance live refetch
- **WHEN** the user toggles importance while a committed title/tag query is active
- **THEN** the list reloads immediately with the new importance set and the same committed title/tags (not an uncommitted draft title)

#### Scenario: No date range controls
- **WHEN** the user opens the Notes list filter bar
- **THEN** there are no updated-after / updated-before (or equivalent) date-range inputs

### Requirement: Ask metadata pre-filter alignment
Path 2 Ask pre-filtering SHALL use the same tag AND and importance membership semantics as Path 1. The Ask UI SHALL expose preset tag multi-select and importance multi-select so users can constrain the embedding candidate pool (for example, medium and high importance notes tagged `dp`) before ranking.

#### Scenario: Ask with tags and importance
- **WHEN** a user asks a question with tags `dp` selected and importance medium and high selected
- **THEN** retrieval considers only that user's embedded notes that contain tag `dp` and have medium or high importance, then ranks within that set

#### Scenario: Ask with no tags
- **WHEN** a user asks a question with no tags selected and all importance levels selected
- **THEN** retrieval is not narrowed by tags and may include any importance level for that user (subject to embedding presence and top_k)
