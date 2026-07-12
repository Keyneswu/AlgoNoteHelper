## Context

AlgoNoteHelper stores personal practice notes in Postgres (`PracticeNote`) with `tags` (`ARRAY`), `importance` (1–3), and timestamps. Path 1 listing (`GET /notes`) today supports tag **OR** (`overlap`), `importance_min`, and created/updated date ranges. The Notes UI uses free-text comma tags and a min-importance + “Any” control. Ask (`POST /ask`) applies the same OR tag / `importance_min` pre-filter before pgvector ranking, but the Ask UI only exposes a free-text tags field.

Owner usage is topic- and title-first; date-range lookup is unused. Practice revisits are not modeled beyond `created_at` / `updated_at`.

## Goals / Non-Goals

**Goals:**

- Efficient Notes catalog filtering: title `ILIKE`, preset tag multi-select with **AND**, importance multi-select with live refetch.
- Shared metadata pre-filter semantics on Ask (tags AND + importance IN).
- Practice history dates on each note (seed on create, append, delete), UI under pitfalls.
- Remove date-range filters from the Notes list UX.

**Non-Goals:**

- Duplicate problem detection or merge.
- Fuzzy client search (Fuse.js / match-sorter).
- Changing Path 2 embedding text composition or ranking algorithm beyond metadata pre-filter params.
- Forcing Ask to hot-reload filters (Ask submits on Ask button only).

## Decisions

### 1. Title search = Postgres `ILIKE`

- **Choice**: Case-insensitive substring on `title` via query param (e.g. `q` or `title`).
- **Why**: Personal corpus is small; users search remembered fragments; no new dependency; same round-trip as other filters.
- **Alternatives**: Fuse.js (typo-tolerant, extra dependency / dual-path filtering); `pg_trgm` (more ops complexity than needed).

### 2. Tag AND via array containment

- **Choice**: When one or more tags are selected, require `PracticeNote.tags @> selected_tags` (normalized ids). Empty selection = no tag predicate.
- **Why**: Multi-tag means “narrow to notes that are all of these topics,” matching owner intent.
- **Alternatives**: Keep OR (`&&` / overlap) — rejected; per-tag mode toggle — YAGNI.

### 3. Importance = multi-value `IN`, not min threshold

- **Choice**: Query params like repeated `importance=2&importance=3`. Default UI: all of {1,2,3} selected. Disallow empty selection in UI (re-select last toggled off, or no-op when only one remains).
- **Why**: Supports “medium and high only” without implying “≥ medium includes high” confusion.
- **BREAKING (API)**: Prefer new `importance` multi-param; stop using `importance_min` in Notes/Ask clients. Backend may keep `importance_min` temporarily unused or remove from Ask schema in the same change for consistency.

### 4. Notes list apply vs live importance

- **Choice**: Maintain `committedQuery = { title, tags }` updated only on Search / Enter. Draft title/tag inputs do not affect fetches until commit. `liveImportance` changes trigger immediate `fetch(committedQuery + liveImportance)`.
- **Why**: Avoids applying unfinished title drafts when toggling importance; keeps Apply for intentional title/tag searches.
- **Ask**: No live refetch; filters apply on submit only (same committed semantics for the request body).

### 5. Shared filter controls

- **Choice**: Reuse / lightly adapt `TagPicker` + a multi-select importance control shared by Notes list and Ask. Preset tags from `PRESET_TAGS`.
- **Why**: One mental model; reduces free-text tag typos on Ask.
- **ask-store**: Persist `tags: string[]` (and importance selection); migrate or ignore legacy comma-string sessionStorage.

### 6. Practice history storage

- **Choice**: `review_dates: Mapped[list[datetime]]` as `ARRAY(TIMESTAMPTZ)` (or date-only if preferred for UX simplicity — prefer timestamptz, display as local date).
- **Behavior**: On create, append `now()`. Detail UI: chips under pitfalls column with × remove; button appends `now()`. PATCH accepts full list replacement (same pattern as `pitfalls` / `tags`).
- **Why**: Matches existing array field style; no extra table for v1.
- **Alternatives**: Separate `practice_reviews` table — better if later need notes per visit; defer. Store only in `source_meta` — weaker typing/queryability.

### 7. Date-range filters

- **Choice**: Remove from Notes UI. Backend may leave `created_*` / `updated_*` query params unused by clients (optional cleanup in same change if low cost).
- **Why**: Product requirement no longer treats date range as a Path 1 axis; practice history covers “when did I do this.”

## Risks / Trade-offs

- **[Risk] AND tags + many presets → empty lists** → Mitigation: empty tag selection means no tag filter; UI copy clarifies AND; easy to deselect.
- **[Risk] `ILIKE '%q%'` cannot use a normal B-tree efficiently** → Mitigation: per-user row counts stay small; acceptable.
- **[Risk] Importance live fetch races with in-flight Search** → Mitigation: ignore stale responses (request id / abort controller).
- **[Risk] Migrating existing notes without `review_dates`** → Mitigation: backfill `review_dates = ARRAY[created_at]` for rows with empty arrays.
- **[Trade-off] Substring search misses typos** → Accepted; fuzzy search deferred.

## Migration Plan

1. Add `review_dates` column (default `{}`), backfill from `created_at`.
2. Ship API support for `q`/`title`, tag containment, `importance` multi; update create to seed `review_dates`.
3. Ship Notes + Ask UI and i18n; remove date filter UI.
4. Rollback: UI can revert to old filters if API keeps backward-compatible params briefly; column add is non-destructive.

## Open Questions

- None blocking; display of review dates as date-only chips vs full timestamp is an implementation detail (prefer compact local date + accessible full value).
