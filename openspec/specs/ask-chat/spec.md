# ask-chat Specification

## Purpose
Multi-turn Ask conversation UI: streaming thread, Context Bar grounding pool, and dual-mode Sessions | Notes rail backed by durable server sessions (ask-sessions).
## Requirements
### Requirement: Session-scoped multi-turn Ask thread
The Ask UI SHALL present a conversation thread (user and assistant messages) for the active Ask session with streaming assistant replies. Multi-turn history for the active session MUST be available for follow-ups. Durable persistence, listing, switching, and deletion of sessions are provided by the ask-sessions capability; the Ask UI MUST integrate with that session list rather than treating the thread as ephemeral-only or hiding multi-session navigation.

#### Scenario: Follow-up in the same session
- **WHEN** a user sends a question and then sends a follow-up in the same Ask session without leaving and clearing state
- **THEN** the assistant response is generated with prior user/assistant turns available as conversation history

#### Scenario: Active session drives the thread
- **WHEN** a durable Ask session is active
- **THEN** the thread shown is that session's conversation (not an anonymous ephemeral-only thread)

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
Context Bar note ids and thread messages MAY be cached in client memory and optional sessionStorage so in-app navigations do not always wipe the active view, but the system MUST treat server-backed Ask sessions (ask-sessions) as the source of truth for conversations. Client cache MUST NOT replace durable server session state when continuing a conversation across browsers or devices.

#### Scenario: Server session is source of truth
- **WHEN** a user completes a multi-turn Ask session and later opens Ask in another browser while authenticated as the same user
- **THEN** the conversation is available via the durable server session list rather than requiring the original browser's client storage

#### Scenario: Client cache is optional
- **WHEN** the client keeps Context Bar note ids or messages in memory or sessionStorage
- **THEN** that cache is subordinate to the loaded server session and MUST NOT be treated as the sole persistence mechanism

### Requirement: Dual-mode Sessions and Notes left rail
The Ask page left rail SHALL provide a **Sessions | Notes** mode toggle. In Sessions mode the rail SHALL show the user's durable Ask session list (as defined by ask-sessions). In Notes mode the rail SHALL show the Context Bar grounding notes for the active session. The system MUST NOT introduce chat folder UI in this change.

#### Scenario: Toggle between Sessions and Notes
- **WHEN** a user selects Sessions or Notes in the left-rail toggle
- **THEN** the rail content switches to the session list or the Context Bar accordingly

#### Scenario: Sessions mode shows session list
- **WHEN** the left rail is in Sessions mode
- **THEN** the user can see and select among their durable Ask sessions (create/switch/delete UX is owned by ask-sessions)

### Requirement: Load session and auto-switch rail to Notes on send
When the user selects a session from the Sessions list, the Ask UI SHALL load that session's conversation thread and Context Bar note ids (via ask-sessions). After a session is selected, the left rail MUST remain on Sessions until the user sends a question in that session; when the user sends a question, the rail MUST automatically switch to Notes mode.

#### Scenario: Click session loads conversation
- **WHEN** a user clicks a session in the Sessions list
- **THEN** the main thread shows that session's messages and the Context Bar reflects that session's context note ids

#### Scenario: Rail stays on Sessions until send
- **WHEN** a user clicks a session and has not yet sent a new question
- **THEN** the left rail remains in Sessions mode

#### Scenario: Auto-switch to Notes on send
- **WHEN** the user sends a question while the left rail is in Sessions mode
- **THEN** the left rail switches to Notes mode

### Requirement: Confirm before hard-deleting a session
The Ask UI SHALL require explicit user confirmation (e.g. AlertDialog) before calling the session hard-delete API. The confirmation MUST warn that deletion is permanent. The UI MUST NOT delete a session on a single click without confirmation.

#### Scenario: Delete requires confirmation
- **WHEN** a user chooses delete on a session in the Sessions list
- **THEN** a confirmation dialog appears and the session is not deleted until the user confirms

#### Scenario: Cancel leaves session intact
- **WHEN** a user dismisses or cancels the delete confirmation
- **THEN** the session remains and still appears in the Sessions list

