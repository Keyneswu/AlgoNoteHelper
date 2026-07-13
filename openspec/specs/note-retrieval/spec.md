# note-retrieval Specification

## Purpose
Path 1 structured filtering and Path 2 retrieve-then-answer for practice notes owned by the current user.
## Requirements
### Requirement: Path 1 structured filter
The system SHALL allow users to unlock practice notes by filtering on structured metadata: optional title substring match (case-insensitive), optional tags with **AND** semantics (note tags must contain every selected tag), optional difficulty membership (note difficulty must be one of the selected levels), and optional practiced date range (at least one `review_dates` entry falls in the inclusive range). The system SHALL return only matching notes owned by the current user. Created/updated timestamp ranges MUST NOT be Path 1 product filter axes.

#### Scenario: Filter by title substring
- **WHEN** a user searches with title query `substring`
- **THEN** the system returns only that user's notes whose title contains that substring case-insensitively

#### Scenario: Filter by multiple tags with AND
- **WHEN** a user selects tags `dp` and `array`
- **THEN** the system returns only notes whose tags include both `dp` and `array`

#### Scenario: Filter by difficulty membership
- **WHEN** a user selects difficulty levels medium and hard
- **THEN** the system returns only notes with difficulty medium or hard (not easy)

#### Scenario: Empty tag selection
- **WHEN** a user applies filters with no tags selected
- **THEN** the system does not constrain results by tags

#### Scenario: Combined title, tags, difficulty, and practiced range
- **WHEN** a user commits a title query, one or more tags, a non-empty difficulty selection, and a practiced date range
- **THEN** the system returns only notes matching all active predicates

### Requirement: Notes list filter interaction
The Notes catalog UI SHALL use preset tag multi-select (not free-text comma entry as the primary control), difficulty multi-select defaulting to all supported levels with no “Any” option, a title search field, and an optional practiced date-range control (HeroUI DateRangePicker or equivalent). Title, tag, and practiced range changes MUST apply only when the user presses Enter or activates Search/Apply. Changing the difficulty selection MUST refetch using the last committed title, tag, and practiced-range query without waiting for Search. The Notes list UI MUST NOT expose created/updated date-range filter controls; practiced range on `review_dates` is allowed.

#### Scenario: Search commits title, tags, and practiced range
- **WHEN** the user edits the title field, selected tags, and practiced date range then presses Enter or Search
- **THEN** the list reloads with those predicates committed

#### Scenario: Difficulty live refetch
- **WHEN** the user toggles difficulty while a committed title/tag/practiced-range query is active
- **THEN** the list reloads immediately with the new difficulty set and the same committed title/tags/range (not uncommitted drafts)

#### Scenario: No created/updated date range controls
- **WHEN** the user opens the Notes list filter bar
- **THEN** there are no created-after / updated-before (or equivalent created/updated) date-range inputs

#### Scenario: Practiced range control present
- **WHEN** the user opens the Notes list filter bar
- **THEN** a practiced date-range control is available

### Requirement: Ask metadata pre-filter alignment
Path 2 Ask pre-filtering SHALL use the same tag AND and difficulty membership semantics as Path 1. The Ask UI SHALL expose preset tag multi-select and difficulty multi-select so users can constrain the embedding candidate pool (for example, medium and hard difficulty notes tagged `dp`) before ranking.

#### Scenario: Ask with tags and difficulty
- **WHEN** a user asks a question with tags `dp` selected and difficulty medium and hard selected
- **THEN** retrieval considers only that user's embedded notes that contain tag `dp` and have medium or hard difficulty, then ranks within that set

#### Scenario: Ask with no tags
- **WHEN** a user asks a question with no tags selected and all difficulty levels selected
- **THEN** retrieval is not narrowed by tags and may include any difficulty level for that user (subject to embedding presence and top_k)

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
The system SHALL embed each practice note as a single retrieval unit using title, problem statement, approach, pitfalls, and code (code MAY be truncated for embedding length limits). Ask answer grounding MUST include the full code body when present so the model can answer code-level questions about retrieved notes.

#### Scenario: Embed after note save
- **WHEN** a user creates or updates embeddable fields on a note and embedding credentials are configured
- **THEN** the system updates that note's vector so Path 2 can retrieve it

#### Scenario: Ask grounding includes code
- **WHEN** Path 2 retrieves notes that contain code and generates an answer
- **THEN** the chat context includes those notes' code fields, not only title/statement/approach/pitfalls
