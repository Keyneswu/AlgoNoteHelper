## Why

Production deploy today rebuilds `api` and `frontend` on the server via `docker compose up --build` after an SSH `git pull`. That works, but CI is missing and the deployable unit is "git tree + compile on host" rather than a tested container image. We want GitHub Actions to run tests, build images, publish them to GHCR, and have the server pull those images—without risking the Postgres named volume.

## What Changes

- Add a CI workflow that runs frontend and backend unit tests (and lint where cheap), builds `api` and `frontend` Docker images, and pushes tagged images to GHCR on `main`.
- Change production deploy from server-side `--build` to `docker compose pull` + `up -d` for `api`/`frontend`, keyed by an `IMAGE_TAG` (git SHA).
- Update Compose so `api`/`frontend` declare both `image:` (registry) and `build:` (local/dev), leaving `db` on the official pgvector image + named volume `pgdata`.
- Keep schema migrations **out** of automatic CD: Alembic / Better Auth migrate remain operator-driven when a release needs them.
- Document GHCR login on the server, required GitHub Variables/Secrets (e.g. production `NEXT_PUBLIC_APP_URL` for image build-args), and that `docker compose down -v` must never be used for routine deploys.
- **Non-goals this change:** writing a full integration-test suite; auto-running Alembic on deploy; multi-environment staging; replacing SSH with a different deploy channel.

## Capabilities

### New Capabilities
- `cicd-pipeline`: CI test + image build/push to GHCR, and CD that deploys by pulling immutable image tags without rebuilding on the host or touching database volumes.

### Modified Capabilities
- `project-bootstrap`: Docker Compose deployment SHALL support production image pull (registry tags) in addition to local `build`, while preserving the Postgres + pgvector named-volume data model.

## Impact

- `.github/workflows/` — new CI workflow; rewrite `deploy.yml` to pull images instead of `--build`.
- `docker-compose.yml` — add `image:` + `IMAGE_TAG` for `api`/`frontend`; root `.dockerignore` if missing.
- GitHub: Packages (GHCR) permissions; Variables/Secrets for build-args and optional deploy tag wiring.
- Production host: one-time `docker login ghcr.io`; deploy script/env gains `IMAGE_TAG`; no change to `pgdata` volume lifecycle.
- App runtime code and DB schema: unchanged unless incidental compose/env docs.
