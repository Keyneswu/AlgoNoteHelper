## MODIFIED Requirements

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

## ADDED Requirements

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
