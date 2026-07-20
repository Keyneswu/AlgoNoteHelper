# ask-sessions Specification

## Purpose
TBD - created by archiving change ask-session-management. Update Purpose after archive.
## Requirements
### Requirement: Durable Ask chat session persistence
The system SHALL persist Ask chat sessions in Postgres using an `AskChatSession` entity scoped to a single authenticated user. Each session MUST belong to exactly one user. Session records MUST NOT be shared across users. The Ask stream APIs (`/api/ask`, `/api/ask/stream`) MUST remain stateless; session persistence is a separate layer written after turns complete.

#### Scenario: Session owned by creating user
- **WHEN** a user creates an Ask chat session
- **THEN** the persisted session row is associated with that user's id and is visible only to that user through session APIs

#### Scenario: Ask APIs remain stateless
- **WHEN** a client calls the Ask stream API with messages and context note ids
- **THEN** the Ask handler does not require a session id to produce a streamed answer

### Requirement: Ask chat message storage
The system SHALL persist Ask conversation messages in Postgres using an `AskChatMessage` entity linked to exactly one `AskChatSession`. Each message MUST record at least role (user or assistant), text content, and an ordering key sufficient to restore turn order. Messages MUST be deleted when their parent session is hard-deleted.

#### Scenario: Messages restored in order
- **WHEN** a user fetches a session that has multiple user and assistant messages
- **THEN** the API returns messages in conversation order matching the stored sequence

#### Scenario: Cascade delete on session removal
- **WHEN** a session is hard-deleted
- **THEN** all message rows for that session are removed from Postgres

### Requirement: Session context note ids storage
Each `AskChatSession` SHALL store `context_note_ids` as an ordered or unordered list of practice-note ids only. The system MUST NOT snapshot note title, body, or other note fields on the session row. Updates to session context MUST replace or persist the current id list after turns; note content MUST be resolved at read time.

#### Scenario: Context ids persisted without note bodies
- **WHEN** a session is updated after a turn with a new Context Bar note id list
- **THEN** the session row stores only those ids and does not embed note Markdown or metadata copies

#### Scenario: Context ids scoped to session owner
- **WHEN** a session update includes context note ids
- **THEN** only ids belonging to the session owner MAY be stored; ids for other users or missing notes MUST be omitted silently

### Requirement: List Ask chat sessions
The system SHALL expose an authenticated API to list the current user's Ask chat sessions. Results MUST include at least session id, title, and `updated_at`. Sessions MUST be ordered by `updated_at` descending (most recently active first). The list MAY omit message bodies, hydrated notes, and `context_note_ids` (those belong on get/update). The list MUST NOT include sessions owned by other users.

#### Scenario: Recent sessions first
- **WHEN** a user lists sessions after updating session A more recently than session B
- **THEN** session A appears before session B in the response

#### Scenario: User isolation on list
- **WHEN** user A lists Ask chat sessions
- **THEN** the response contains only sessions owned by user A

### Requirement: Create Ask chat session
The system SHALL expose an authenticated API to create a new Ask chat session for the current user. A newly created session MUST start with title **New chat** (localized in the UI via i18n; the stored default title key/value MUST support that label). A new session MUST start with an empty message list and an empty `context_note_ids` list unless the client supplies initial context ids owned by the user. Optional nullable `folder_id` MAY be accepted on create but folder assignment behavior is out of scope for this capability.

#### Scenario: New session default title
- **WHEN** a user creates a session without supplying a custom title
- **THEN** the persisted session title is the default **New chat** label

#### Scenario: New session empty transcript
- **WHEN** a user creates a session
- **THEN** the session has no messages until the user completes a turn

### Requirement: Ensure default session on Ask entry
When a user enters Ask and has zero persisted sessions, the system MUST ensure at least one session exists titled **New chat** before presenting the session list or active thread. The client MAY invoke a dedicated ensure/create endpoint or rely on list/create behavior, but the user MUST NOT be left with no selectable session.

#### Scenario: First visit creates New chat
- **WHEN** a user opens Ask for the first time and has no Ask chat sessions
- **THEN** the system creates (or returns) exactly one session titled **New chat** for that user

#### Scenario: Existing sessions unchanged
- **WHEN** a user opens Ask and already has one or more sessions
- **THEN** the system does not create an additional session solely because Ask was opened

#### Scenario: Recreate after deleting the last session
- **WHEN** a user hard-deletes their only remaining Ask chat session
- **THEN** the system ensures a fresh **New chat** session exists so the user is not left with an empty session list

### Requirement: Session title from first user message
After the first user message in a session whose title is still the default **New chat**, the system MUST update the session title to a truncated form of that message text. Truncation MUST preserve a readable prefix (implementation-defined max length) and MUST NOT require LLM-generated titles. Subsequent user messages MUST NOT automatically rename the session unless a future capability adds manual rename.

#### Scenario: First message renames default title
- **WHEN** a user sends their first message in a session still titled **New chat**
- **THEN** after the turn is persisted the session title becomes a truncated version of that user message

#### Scenario: Later messages keep title
- **WHEN** a session already has a non-default title and the user sends another message
- **THEN** the session title remains unchanged by that message alone

### Requirement: Get Ask chat session with hydration
The system SHALL expose an authenticated API to fetch one session by id for the current user. The response MUST include session metadata, ordered messages, stored `context_note_ids`, and hydrated practice-note payloads resolved from those ids. Opening a session MUST NOT trigger semantic retrieval or re-fetch notes via the Ask retrieval path solely to populate the Context Bar. Note ids that no longer exist or are not owned by the user MUST be dropped silently from hydration; the stored id list on the session MAY still be cleaned on subsequent update.

#### Scenario: Open session restores transcript
- **WHEN** a user gets a session they own
- **THEN** the response includes all persisted messages for that session in order

#### Scenario: Hydrate notes from stored ids only
- **WHEN** a user gets a session with `context_note_ids` referencing existing owned notes
- **THEN** the response includes note payloads for those ids without running Ask retrieval

#### Scenario: Missing note ids omitted silently
- **WHEN** a user gets a session whose `context_note_ids` includes a deleted or inaccessible note id
- **THEN** that id is omitted from hydrated notes and the get request still succeeds

#### Scenario: Cross-user session forbidden
- **WHEN** a user requests a session id owned by another user
- **THEN** the system responds with not-found or forbidden and does not leak session existence

### Requirement: Update Ask chat session after turn
The system SHALL expose an authenticated API to update a session owned by the current user after a completed Ask turn (or equivalent client sync point). An update MUST be able to persist appended or replaced messages, the current `context_note_ids` list, and title changes per the first-message rule. Partial updates MUST NOT clear unspecified fields unless explicitly requested. The update MUST bump `updated_at` so list ordering reflects recent activity.

#### Scenario: Persist transcript after streaming completes
- **WHEN** a user finishes an Ask turn in an active session
- **THEN** the client can update the session so new user and assistant messages are stored durably

#### Scenario: Persist Context Bar ids after turn
- **WHEN** a turn merges or removes notes in the Context Bar
- **THEN** the client can update the session so `context_note_ids` matches the bar after that turn

#### Scenario: Updated session rises in list order
- **WHEN** a session is updated after a turn
- **THEN** a subsequent list request orders that session ahead of older inactive sessions

### Requirement: Hard delete Ask chat session
The system SHALL expose an authenticated API to hard-delete a session by id. Deletion MUST remove the session row and cascade-delete all related messages in Postgres. The API MUST perform a hard delete (no soft archive). UI confirmation before delete is a client concern; the API MUST NOT implement soft-delete or restore. Only the session owner MAY delete their session.

#### Scenario: Owner hard deletes session
- **WHEN** the session owner calls delete on a valid session id
- **THEN** the session and its messages are permanently removed

#### Scenario: Non-owner cannot delete
- **WHEN** a user attempts to delete a session owned by another user
- **THEN** the system rejects the request and leaves the session unchanged

#### Scenario: Delete idempotent or not-found
- **WHEN** the owner deletes a session that was already deleted
- **THEN** the system responds with success or not-found without resurrecting data

### Requirement: Optional folder hook without folder behavior
`AskChatSession` MAY include a nullable `folder_id` field on create, get, and update payloads for future folder features (list MAY omit it). This capability MUST NOT require folder CRUD, folder UI, or filtering sessions by folder.

#### Scenario: Folder id nullable on create
- **WHEN** a user creates a session without a folder
- **THEN** `folder_id` is null and the session is fully usable

#### Scenario: No folder requirements in list
- **WHEN** a user lists sessions
- **THEN** the API returns sessions regardless of `folder_id` and does not require folder metadata

