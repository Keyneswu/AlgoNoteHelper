## MODIFIED Requirements

### Requirement: Docker Compose deployment
The system SHALL provide Docker Compose services for the frontend, API, and Postgres with pgvector sufficient to run a full local/self-hosted stack. For API and frontend, Compose SHALL support both local `build` and pulling pre-built images from a container registry via a configurable image tag, so production can deploy without compiling on the host. Database data MUST live in a named volume (or equivalent durable store) that routine `compose up` / image pull deploys do not delete.

#### Scenario: Compose up brings stack online
- **WHEN** an operator runs Docker Compose for the project
- **THEN** frontend, API, and database services start and the app is reachable for first-run setup

#### Scenario: Production uses registry images
- **WHEN** an operator sets a registry image tag and runs Compose pull/up for API and frontend without `--build`
- **THEN** those services run the pulled images while the database service continues using the Postgres/pgvector image and existing named volume data

#### Scenario: Local build still works
- **WHEN** a developer runs Compose with build for API and frontend without relying on GHCR
- **THEN** the stack still builds and starts locally for development
