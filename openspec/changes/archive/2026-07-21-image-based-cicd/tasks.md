## 1. Compose & Docker hygiene

- [x] 1.1 Update `docker-compose.yml` so `api` and `frontend` declare `image:` (GHCR name + `${IMAGE_TAG:-local}`) while keeping `build:` for local/dev
- [x] 1.2 Add a root `.dockerignore` suitable for `Dockerfile.api` build context (exclude `.git`, local envs, frontend junk, caches)
- [x] 1.3 Document in README (brief) how local `up --build` vs production `IMAGE_TAG` + `pull` work, and that `down -v` wipes data

## 2. CI: test + build + push

- [x] 2.1 Add `.github/workflows/ci.yml` on `pull_request` and `push` to `main` with frontend job (`pnpm install`, lint, test)
- [x] 2.2 Add backend job (`uv sync --group dev`, ruff, pytest)
- [x] 2.3 On `main` only: build and push `algonote-api` and `algonote-frontend` to GHCR tagged with git SHA (and optional `main` tag); pass production `NEXT_PUBLIC_APP_URL` build-arg from a GitHub Variable
- [x] 2.4 Set workflow `permissions` for `packages: write` / `contents: read` as needed for GHCR push

## 3. CD: pull instead of build

- [x] 3.1 Rewrite `.github/workflows/deploy.yml` to depend on successful CI/image publish (or equivalent gate), SSH to host, `git fetch`/`reset` for compose sync, set `IMAGE_TAG` to the commit SHA
- [x] 3.2 Deploy script: `docker login ghcr.io`, `docker compose pull api frontend`, `docker compose up -d` **without** `--build` and without `-v`; print `compose ps`
- [x] 3.3 Keep `workflow_dispatch` for manual redeploy of a chosen ref/SHA

## 4. Host & GitHub configuration

- [x] 4.1 Add/document GitHub Variable(s) for production frontend bake URL (and any other bake-time args)
- [x] 4.2 One-time server setup notes: GHCR login credentials, confirm existing SSH secrets still used
- [x] 4.3 Smoke path: after first green `main`, manually verify pull + up on server once before relying on auto-deploy (or watch first auto-deploy carefully)

## 5. Ops boundaries (migrations)

- [x] 5.1 Explicitly leave Alembic / Better Auth migrate out of deploy.yml; add a short README or comment checklist for releases that include schema changes (backup → migrate → verify)
