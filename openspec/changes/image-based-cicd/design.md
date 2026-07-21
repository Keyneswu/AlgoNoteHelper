## Context

AlgoNoteHelper runs as a three-service Compose stack (`frontend`, `api`, `db`) on a single Tencent Cloud host. Data lives in named volume `pgdata`. Today CD SSHes in, `git reset --hard origin/main`, and runs `docker compose up --build -d`, compiling on the server. There is no CI gate. The desired model is: Actions builds and tests, publishes immutable images to GHCR, and the host pulls those tags—leaving `db`/volume untouched.

Constraints: real production data; never use `down -v` for routine deploys; Alembic and Better Auth migrations stay operator-driven; SSH deploy secrets already work; single production environment (no staging).

## Goals / Non-Goals

**Goals:**
- CI runs unit tests (frontend vitest, backend pytest/ruff as available) before images are trusted for production.
- CI builds `api` and `frontend` images with correct production build-args and pushes to GHCR tagged by git SHA.
- Production CD pulls those images and recreates only app services; `db` and `pgdata` remain.
- Local/dev can still `compose up --build` without requiring GHCR.

**Non-Goals:**
- Full integration-test suite or pgvector-in-CI as a hard requirement this change.
- Automatic `alembic upgrade` / Better Auth migrate on every deploy.
- Blue/green, multi-region, or non-SSH deploy transport.
- Baking database data into images.

## Decisions

### D1 — GHCR as the image registry
- **Choice:** Publish `ghcr.io/<owner>/algonote-api:<sha>` and `ghcr.io/<owner>/algonote-frontend:<sha>` (plus optional moving tag `main` for convenience). Packages private, readable via `GITHUB_TOKEN` in Actions and a server login (PAT or deploy token with `read:packages`).
- **Why:** Native to GitHub; no extra registry bill for this scale.
- **Alternatives:** Docker Hub (extra account); Actions `upload-artifact` for tarballs (awkward for large images, poor pull UX).

### D2 — Single compose file with `image` + `build`
- **Choice:** Keep one `docker-compose.yml`. Each of `api`/`frontend` sets `image: ghcr.io/...:${IMAGE_TAG:-local}` and retains `build:` for local. Production sets `IMAGE_TAG=<sha>` then `pull` + `up -d` without `--build`.
- **Why:** Minimal file sprawl; matches current mental model.
- **Alternatives:** `docker-compose.prod.yml` overlay only—cleaner separation, more files to sync on the host.

### D3 — CI vs CD workflow split
- **Choice:**
  - `ci.yml` (or equivalent): on `pull_request` and `push` to `main` — install, lint/test, docker build; push to GHCR **only on `main`** (PRs may build without push, or push `:pr-<n>` if useful later).
  - `deploy.yml`: on `main` after CI success (or `workflow_run` / `needs` via reusable workflow) + `workflow_dispatch` — SSH: sync repo for compose/scripts, set `IMAGE_TAG` to the commit SHA, `docker login`, `compose pull api frontend`, `compose up -d` (no `--build`, no `-v`).
- **Why:** Separates "prove artifact" from "roll out"; keeps manual dispatch.
- **Alternatives:** Single monolithic workflow; CD-only without PR CI (rejected—loses the gate).

### D4 — Host still git-pulls for orchestration, not for app bits
- **Choice:** Deploy continues to update the git checkout so `docker-compose.yml` and helper scripts stay in sync; **application code ships only via images**.
- **Why:** Compose and env templates still need a source of truth on disk; avoids inventing a second config channel.
- **Alternatives:** Bake compose into an ops repo or copy via scp—more moving parts.

### D5 — Migrations stay manual
- **Choice:** CD never runs Alembic or Better Auth migrate. When a release includes schema changes, operator runs migrate over SSH after (or carefully before) image rollout, optionally after `pg_dump`.
- **Why:** Protects production data from a bad auto-migrate; matches existing project practice.
- **Alternatives:** Optional `workflow_dispatch` migrate job later—out of scope unless added explicitly.

### D6 — Frontend production build-arg in CI
- **Choice:** CI passes `NEXT_PUBLIC_APP_URL` (and any other bake-time public env) from a GitHub Variable (e.g. `NEXT_PUBLIC_APP_URL=https://algonote.keyneswu.com`) into `docker build --build-arg`.
- **Why:** Next public env is fixed at image build time; server `.env` alone cannot fix a wrong bake.
- **Alternatives:** Runtime-only config injection—would require app changes beyond this change.

### D7 — Database safety invariant
- **Choice:** Document and enforce in deploy script: never `down -v`; never recreate `db` unless compose db definition intentionally changes; CI Postgres (if added later) is ephemeral and unrelated to `pgdata`.
- **Why:** Addresses the primary operator fear; volume is the sole durable store.

## Risks / Trade-offs

- **[Risk] Private GHCR pull fails on server** → Mitigation: one-time `docker login`; document token scopes; fail deploy loudly before `up`.
- **[Risk] Wrong `NEXT_PUBLIC_APP_URL` baked into frontend image** → Mitigation: Variable required on main builds; smoke-check URL after first image deploy.
- **[Risk] Compose on server drifts from image tags** → Mitigation: deploy always `git fetch` + set `IMAGE_TAG` to the same SHA being deployed.
- **[Risk] Schema change shipped in image without migrate** → Mitigation: release checklist; CD does not claim to migrate; API may error until operator upgrades—prefer expand/contract in future, accept brief ops step now.
- **[Trade-off] PR builds without push** → Faster/safer; means only `main` images exist for rollback (acceptable for single-prod).

## Migration Plan

1. Land compose `image`+`build` and workflows; do **not** flip production until a manual `docker pull` + `up` smoke succeeds on the host.
2. Create GHCR packages via first successful `main` push (or manual workflow).
3. On server: `docker login ghcr.io`, set deploy to use `IMAGE_TAG`, remove `--build` from routine path.
4. Rollback: set `IMAGE_TAG` to previous known-good SHA, `pull` + `up -d` (no volume touch). Broken migration (if any was run manually) is a separate restore-from-`pg_dump` path.

## Open Questions

- Exact GitHub package visibility (private vs internal) and whether to use `GITHUB_TOKEN` fine-grained PAT for server pull—resolve during apply with whichever works on the host.
- Whether deploy waits on `workflow_run` of CI or a single workflow with `needs:`—prefer one clear chain during implementation.
