# ask-chat Specification

## Purpose
Session-scoped multi-turn Ask conversation UI: streaming thread, Context Bar grounding pool, and ephemeral client state without durable server-side conversations.

## Requirements

### Requirement: Session-scoped multi-turn Ask thread
The Ask UI SHALL present a single in-session conversation thread (user and assistant messages) with streaming assistant replies. The system MUST NOT require server-side persistence of threads or messages for this capability. The Ask UI MUST NOT expose a multi-thread list or conversation switcher in this version.

#### Scenario: Follow-up in the same session
- **WHEN** a user sends a question and then sends a follow-up in the same Ask session without leaving and clearing state
- **THEN** the assistant response is generated with prior user/assistant turns available as conversation history

#### Scenario: No thread switcher
- **WHEN** a user opens the Ask page
- **THEN** there is no UI to create, rename, archive, or switch among multiple saved conversations

### Requirement: Context Bar as editable grounding pool
The Ask UI SHALL show a Context Bar listing practice notes used as answer grounding for the session. Newly retrieved notes MUST be merged into the bar by note id (duplicates MUST NOT appear twice). The user MUST be able to remove notes from the bar. The UI MUST NOT offer manual addition of arbitrary catalog notes to the bar in this version. Answer grounding for each turn MUST use all notes present in the Context Bar at request time (after that turn’s merge), not only the notes newly retrieved on that turn.

#### Scenario: Merge on retrieve
- **WHEN** a turn retrieves notes that include some ids already in the Context Bar and some new ids
- **THEN** only the new notes are added to the bar and existing entries remain

#### Scenario: User removes a note
- **WHEN** the user removes a note from the Context Bar and then sends another question
- **THEN** that note is not included in grounding for the new answer unless a later retrieval adds it again

#### Scenario: No manual add control
- **WHEN** a user views the Context Bar
- **THEN** there is no control whose primary purpose is to search the catalog and add a note without AI retrieval

### Requirement: Streaming Ask turns via assistant-ui
The Ask conversation UI SHALL be built with assistant-ui thread primitives (or equivalent Thread component) backed by a runtime that streams assistant text from the Ask stream API. While a reply is streaming, the UI MUST show incremental assistant content.

#### Scenario: Token streaming
- **WHEN** the Ask stream API emits answer tokens for a turn
- **THEN** the assistant message in the thread updates incrementally before the turn completes

### Requirement: Ephemeral client session state
Context Bar note ids and thread messages MAY be kept in client memory and optional sessionStorage so in-app navigations do not always wipe the session, but the system MUST NOT treat Ask conversations as durably stored server records.

#### Scenario: No server conversation record
- **WHEN** a user completes a multi-turn Ask session
- **THEN** the backend does not create a durable conversation entity required to continue that session later from another browser
