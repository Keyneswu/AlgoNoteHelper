## ADDED Requirements

### Requirement: CI runs automated checks before trusting images
The project SHALL provide a GitHub Actions CI workflow that, on pull requests and on pushes to `main`, checks out the repository and runs the project's frontend unit tests and backend unit tests (and inexpensive lint commands already defined in the repo, such as ESLint and Ruff when configured). CI MUST fail the job when any of those checks fail.

#### Scenario: Pull request with failing tests
- **WHEN** a pull request triggers CI and a unit test fails
- **THEN** the CI workflow fails and does not publish production deploy tags as a successful release artifact

#### Scenario: Main branch checks pass
- **WHEN** a push to `main` triggers CI and all configured unit tests and lint steps succeed
- **THEN** CI proceeds to the image build and publish steps defined for `main`

### Requirement: CI builds and publishes app images to GHCR
On successful `main` CI, the system SHALL build Docker images for the API and frontend services and push them to GitHub Container Registry (GHCR) tagged with the git commit SHA (and MAY also update a moving tag such as `main`). Frontend image builds MUST pass the production `NEXT_PUBLIC_APP_URL` (or equivalent bake-time public URL) as a build-arg from CI configuration, not hard-coded localhost. CI MUST NOT bake production database data into images.

#### Scenario: Main publishes immutable tags
- **WHEN** CI succeeds on `main` for commit `abc123`
- **THEN** GHCR contains API and frontend images tagged with that commit identity

#### Scenario: Frontend bake uses production public URL
- **WHEN** CI builds the frontend image for production deploy
- **THEN** the build receives the configured production app URL build-arg rather than a localhost default

### Requirement: CD deploys by pulling images without rebuilding on the host
Production continuous deployment SHALL update the host git checkout as needed for Compose/orchestration files, set an image tag corresponding to the deploy commit, authenticate to GHCR, pull the API and frontend images, and run Compose to recreate those services **without** `--build` and **without** removing named volumes. The database service MUST remain on the official Postgres/pgvector image with data in the existing named volume; routine CD MUST NOT replace or wipe that volume.

#### Scenario: Routine deploy leaves database volume intact
- **WHEN** CD runs after a successful image publish
- **THEN** API and frontend containers run the pulled image tags and the Postgres named volume is unchanged

#### Scenario: Deploy does not compile on the server
- **WHEN** CD brings up API and frontend after a release
- **THEN** Compose does not perform a server-side image build for those services as part of the routine path

### Requirement: Schema migrations remain operator-driven
Automatic CD MUST NOT run Alembic upgrades or Better Auth schema migrations as part of the default deploy path. When a release requires schema changes, an operator SHALL apply migrations separately (for example over SSH) with awareness of production data.

#### Scenario: Default deploy skips migrate
- **WHEN** CD completes a routine image pull deploy
- **THEN** the deploy scripts have not executed `alembic upgrade` or Better Auth migrate unless an operator explicitly invoked a separate migration procedure
