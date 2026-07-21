# notes-module-structure Specification

## Purpose
Structural rules for compacted notes client and backend modules: shared BFF client usage, session guard hook, notes API module, shared create/edit form, and backend owned-note / filter / vector helpers — without changing user-visible product behavior beyond consistency.
## Requirements
### Requirement: Shared client BFF JSON access
The system SHALL perform browser-side JSON calls to the Next BFF (`/api/bff/...`) for notes-related operations through a shared client helper that applies consistent non-OK error extraction, rather than each page implementing its own `fetch` and error parsing.

#### Scenario: Failed notes create surfaces BFF error
- **WHEN** the owner submits a new note and the BFF returns a non-OK JSON body with an `error` field
- **THEN** the create flow surfaces that error message to the user (or the same fallback behavior as before this change)

#### Scenario: Notes API module covers core CRUD and similar
- **WHEN** the client creates, loads, updates, deletes a note, or requests similar notes before create
- **THEN** those calls go through the shared notes client module (not ad-hoc page-local `fetch` to those endpoints)

### Requirement: Shared client session gate
Protected client pages that currently require a signed-in user SHALL use a shared session-guard hook that redirects unauthenticated users to login after the session query settles, without requiring a Next.js protected-route layout reorganization.

#### Scenario: Unauthenticated visit to notes
- **WHEN** an unauthenticated user opens a protected notes page and the session query has settled
- **THEN** the client redirects them to the login page

#### Scenario: Authenticated visit renders page
- **WHEN** an authenticated user opens a protected notes page
- **THEN** the page renders its content without requiring a duplicated per-page redirect effect implementation

### Requirement: Shared create and detail note editor form
The create-note and note-detail pages SHALL render the shared practice-note field editor (title, statement, approach, code, pitfalls, tags, difficulty, and statement/approach AI rewrite affordances) from one shared form component. Detail-only controls (practice history, save/return, delete, dirty-draft bar) MAY remain page-owned via composition slots or adjacent page UI.

#### Scenario: Create and detail share field editing
- **WHEN** the owner edits statement or approach on either the new-note page or an existing note detail page
- **THEN** both pages use the same shared editor form implementation for those fields

#### Scenario: Detail-only chrome remains available
- **WHEN** the owner opens an existing note with unsaved edits
- **THEN** detail-only behaviors such as the dirty-draft bar, practice history editing, save-and-return, and delete remain available as before

### Requirement: Shared backend owned-note and filter helpers
Note read/update/merge/delete paths that enforce ownership SHALL obtain the note through a shared owned-note lookup that returns not-found when the note is missing or not owned by the caller. List and ask retrieval paths that filter by tags and difficulty SHALL use a shared filter helper so normalization rules stay consistent.

#### Scenario: Non-owner note fetch
- **WHEN** a user requests a note id they do not own
- **THEN** the API responds with not-found using the same ownership failure behavior as before

#### Scenario: Shared filters on list and ask
- **WHEN** the owner lists notes with tag/difficulty filters and separately runs ask retrieval with the same filter intent
- **THEN** both paths apply the same shared tag and difficulty filter normalization

### Requirement: Shared pgvector distance helper
Similarity search and ask retrieval that order or filter notes by embedding distance SHALL build that vector distance expression through a shared helper so both paths do not maintain separate SQL literal construction.

#### Scenario: Similar notes and ask retrieve share distance construction
- **WHEN** the system runs note similarity search and when it runs embedding-based ask retrieval
- **THEN** both use the shared vector distance helper for the distance expression
