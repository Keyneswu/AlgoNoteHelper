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
The system SHALL support natural-language Ask turns by (1) retrieving relevant practice notes for the current user under the active tag/difficulty pre-filters, (2) merging newly retrieved notes into the session Context Bar (the live grounding list), and (3) answering or summarizing using only the notes in the Context Bar after that merge. On each user turn the system SHALL re-run retrieval and merge by note id (retrieval MUST NOT automatically remove notes from the Context Bar). The answer MUST be grounded on the full current Context Bar set for that turn, not solely on the latest retrieval batch. Conversation history from prior turns in the same session MUST be included in the chat completion request when present.

#### Scenario: Scenario-style semantic question
- **WHEN** a user asks which of their notes relate to a scenario such as reservoir water / draining water
- **THEN** the system retrieves relevant notes, surfaces them via the Context Bar (merged into any existing bar entries), and provides an answer or summary grounded in the Context Bar notes

#### Scenario: Empty effective grounding set
- **WHEN** after loading the client-supplied context note ids and merging this turn’s retrieval the effective grounding set is empty
- **THEN** the system reports that no relevant notes were found and does not invent practice notes

#### Scenario: Answer grounded only on Context Bar
- **WHEN** the system produces a Path 2 answer for a turn
- **THEN** the answer MUST be based on the notes in the Context Bar for that turn (client context ids successfully loaded plus newly retrieved notes) and MUST NOT present external problem knowledge as if it were the user's notes

#### Scenario: Follow-up reuses and extends the pool
- **WHEN** a user asks a follow-up after the Context Bar already contains notes and retrieval returns additional distinct notes
- **THEN** the new notes are merged into the Context Bar and the follow-up answer may use both prior and newly added notes

#### Scenario: Every turn retrieves
- **WHEN** a user sends a second or later message in the same Ask session
- **THEN** the system performs semantic retrieval for that turn (subject to filters and embedding availability) and merges results into the Context Bar rather than skipping retrieval because the bar is non-empty

### Requirement: Ask request carries history and context note ids
Path 2 Ask APIs SHALL accept optional prior conversation messages and the list of Context Bar note ids owned by the current user. The server MUST ignore context note ids that are missing or not owned by the caller. Streaming responses MUST emit the newly added notes for that turn (notes retrieved that were not already in the supplied context ids) before or alongside answer tokens so clients can merge into the Context Bar.

#### Scenario: Context ids scoped to owner
- **WHEN** a request includes a context note id that belongs to another user or does not exist
- **THEN** the system omits that id from grounding and continues with the remaining valid notes

#### Scenario: Stream reports notes added
- **WHEN** a streaming Ask turn retrieves notes not already listed in the request’s context note ids
- **THEN** the stream includes those newly added notes as structured note payloads for the client to merge into the Context Bar

#### Scenario: Single-shot compatibility
- **WHEN** a client calls Ask with an empty context note id list and no prior messages
- **THEN** behavior matches a first turn: retrieve, treat all retrieved notes as added, and answer grounded on that set

### Requirement: Entry-level embeddings
The system SHALL embed each practice note as a single retrieval unit using title, problem statement, approach, pitfalls, and code (code MAY be truncated for embedding length limits). Ask answer grounding MUST include the full code body when present so the model can answer code-level questions about retrieved notes.

#### Scenario: Embed after note save
- **WHEN** a user creates or updates embeddable fields on a note and embedding credentials are configured
- **THEN** the system updates that note's vector so Path 2 can retrieve it

#### Scenario: Ask grounding includes code
- **WHEN** Path 2 retrieves notes that contain code and generates an answer
- **THEN** the chat context includes those notes' code fields, not only title/statement/approach/pitfalls
