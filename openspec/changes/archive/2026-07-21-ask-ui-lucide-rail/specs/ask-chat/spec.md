## MODIFIED Requirements

### Requirement: Context Bar as editable grounding pool
The Ask UI SHALL expose an editable grounding pool of practice notes for the active session via a **Notebook chip** in the main conversation column (not in the left history rail). The chip MUST show the current note count and open a popover (or equivalent overlay) listing those notes. Newly retrieved notes MUST be merged into the pool by note id (duplicates MUST NOT appear twice). The user MUST be able to remove notes from the pool via the popover. The chip MUST be hidden when the pool is empty (count is 0). The UI MUST NOT offer manual addition of arbitrary catalog notes to the pool in this version. Answer grounding for each turn MUST use all notes present in the pool at request time (after that turn’s merge), not only the notes newly retrieved on that turn.

#### Scenario: Merge on retrieve
- **WHEN** a turn retrieves notes that include some ids already in the grounding pool and some new ids
- **THEN** only the new notes are added to the pool and existing entries remain

#### Scenario: User removes a note
- **WHEN** the user removes a note from the Notebook chip popover and then sends another question
- **THEN** that note is not included in grounding for the new answer unless a later retrieval adds it again

#### Scenario: No manual add control
- **WHEN** a user opens the Notebook chip popover
- **THEN** there is no control whose primary purpose is to search the catalog and add a note without AI retrieval

#### Scenario: Chip hidden when empty
- **WHEN** the grounding pool has zero notes
- **THEN** the Notebook chip is not shown

#### Scenario: Chip shows count when non-empty
- **WHEN** the grounding pool has one or more notes
- **THEN** the Notebook chip is visible and indicates the note count

### Requirement: Streaming Ask turns via assistant-ui
The Ask conversation UI SHALL be built with assistant-ui thread primitives (or equivalent Thread component) backed by a runtime that streams assistant text from the Ask stream API. While a reply is streaming, the UI MUST show incremental assistant content. Composer send and cancel controls MUST use assistant-ui `ComposerPrimitive.Send` / `ComposerPrimitive.Cancel` (or equivalent) with Lucide icons rather than custom handlers that bypass those primitives as the primary send/cancel path.

#### Scenario: Token streaming
- **WHEN** the Ask stream API emits answer tokens for a turn
- **THEN** the assistant message in the thread updates incrementally before the turn completes

#### Scenario: Icon send and cancel
- **WHEN** the user views the Ask composer idle or while a run is in progress
- **THEN** send and cancel are presented as Lucide icon controls with accessible names (not primary reliance on visible “Send”/“Stop” labels)

## ADDED Requirements

### Requirement: History-only collapsible left rail
The Ask page left rail (desktop / `md+`) SHALL show only the durable Ask session history (as defined by ask-sessions). The rail MUST NOT include a Sessions|Notes mode toggle and MUST NOT host the Context Bar / grounding pool. The rail MUST support ChatGPT-style collapse: when collapsed, a narrow icon strip remains with at least expand and new-chat icon controls and MUST NOT show session title text; when expanded, the session list and icon new-chat control are visible. Collapse preference MUST persist across reloads for the same browser (e.g. `localStorage`). Icon-only rail controls MUST expose accessible names via i18n `aria-label` (or equivalent).

#### Scenario: Rail shows sessions only
- **WHEN** a user opens Ask on a viewport that shows the left rail
- **THEN** the rail content is the session list (create / select / delete) and not a Notes mode panel

#### Scenario: Collapse hides titles keeps icons
- **WHEN** the user collapses the left rail
- **THEN** session titles are hidden and expand + new-chat icon controls remain available

#### Scenario: Expand restores list
- **WHEN** the user expands a collapsed left rail
- **THEN** the session list with titles is visible again

#### Scenario: Collapse preference persists
- **WHEN** the user collapses the rail and reloads Ask in the same browser
- **THEN** the rail remains collapsed until the user expands it

### Requirement: Lucide icon chrome for Ask actions
Ask session and thread chrome that represents a single clear action (new chat, delete session, collapse/expand rail, Notebook chip, composer send/cancel, and Ask-local loading indicators) SHALL use Lucide icons from `lucide-react`. Pending / loading states in the Ask session list and other Ask wait surfaces in this change MUST use a rotating Lucide `Loader2` (or equivalent Lucide spinner) rather than plain loading text alone.

#### Scenario: New chat is plus icon
- **WHEN** the user views the Ask history rail header (expanded or collapsed icon strip)
- **THEN** new chat is a Plus (or equivalent) icon control with an accessible name, not a text-only “New chat” button as the primary affordance

#### Scenario: Session list loading uses spinner
- **WHEN** Ask sessions are loading
- **THEN** the UI shows a Lucide loading spinner (not only a loading sentence)

## REMOVED Requirements

### Requirement: Dual-mode Sessions and Notes left rail
**Reason**: Left rail is history-only; grounding moves to the Notebook chip in the main column.
**Migration**: Use the Notebook chip + popover for context notes; session list remains the sole rail content.

### Requirement: Load session and auto-switch rail to Notes on send
**Reason**: Notes mode and the Sessions|Notes toggle are removed; there is no Notes rail mode to switch into after send.
**Migration**: Selecting a session still loads thread + context note ids; grounding is managed via the Notebook chip when the pool is non-empty.
