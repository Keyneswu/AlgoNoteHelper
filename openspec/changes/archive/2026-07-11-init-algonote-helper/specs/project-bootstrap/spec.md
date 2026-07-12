## ADDED Requirements

### Requirement: Backend-first repository layout
The system project SHALL keep the FastAPI backend as the primary tree at the repository root (e.g. `app/`) and place the Next.js application under `frontend/`.

#### Scenario: Developer locates services
- **WHEN** a developer inspects the repository
- **THEN** Python API code lives outside `frontend/` and the Next.js app lives under `frontend/`

### Requirement: Docker Compose deployment
The system SHALL provide Docker Compose services for the frontend, API, and Postgres with pgvector sufficient to run a full local/self-hosted stack.

#### Scenario: Compose up brings stack online
- **WHEN** an operator runs Docker Compose for the project
- **THEN** frontend, API, and database services start and the app is reachable for first-run setup

### Requirement: Identity bridge to API
The system SHALL authenticate browser sessions in the frontend auth layer and invoke FastAPI only with a server-side identity bridge that associates requests with the authenticated user id; FastAPI note operations MUST scope by that user id.

#### Scenario: Authenticated note list via bridge
- **WHEN** a logged-in user requests their notes through the frontend
- **THEN** FastAPI receives the bridged user identity and returns only that user's notes

### Requirement: Product naming
The product SHALL be referred to as AlgoNoteHelper in user-facing copy for this change's MVP.

#### Scenario: App title
- **WHEN** a user opens the application shell
- **THEN** the product name shown is AlgoNoteHelper

### Requirement: HeroUI v3 component library
The frontend SHALL use HeroUI v3 (`@heroui/react` and `@heroui/styles`) with Tailwind CSS v4 for MVP UI controls (buttons, inputs, forms, selects, tables, dialogs, and related primitives), following the official HeroUI Next.js / quick-start setup.

#### Scenario: HeroUI styles loaded
- **WHEN** the frontend application boots
- **THEN** HeroUI styles are imported after Tailwind CSS so components render with HeroUI styling

#### Scenario: MVP pages use HeroUI primitives
- **WHEN** a developer implements setup, login, notes, import, ask, or settings screens
- **THEN** interactive controls are built with HeroUI components rather than unstyled native-only controls as the default approach
