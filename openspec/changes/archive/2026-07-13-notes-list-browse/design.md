## Context

`GET /notes` today returns a bare `list[PracticeNote]` ordered by `updated_at DESC`, with title/tags/importance filters. The Notes UI commits title/tags on Search and live-refetches on importance. An earlier change intentionally removed created/updated date-range from Path 1 UX; unused `created_*` / `updated_*` query params remain on the API. Practice revisits live in `review_dates`. Preset topic order in `frontend/src/lib/tags.ts` (`PRESET_TAGS`) mirrors the owner's learning path.

This change renames importance → difficulty end-to-end, and adds paginated browse with sort modes, practiced-day range, URL sync, and HeroUI Pagination / DateRangePicker.

## Goals / Non-Goals

**Goals:**

- Full rename `importance` → `difficulty` (DB, API, Ask, UI, i18n) with Hard/Medium/Easy labels; scale `3|2|1` (higher = harder).
- Paginated Notes list: fixed `page_size=8`, response envelope with `total`.
- Sort: `learning` (default), `difficulty` + `order=asc|desc`, `practiced` (`max(review_dates)` DESC).
- Practiced date-range filter on `review_dates` intersection; Search/Enter commit with title/tags.
- Difficulty multi-select stays live refetch.
- Sync committed browse state to URL query params.
- HeroUI v3 `Pagination` + `DateRangePicker` composition APIs.

**Non-Goals:**

- Configurable page size or infinite scroll.
- Sorting Ask retrieval results (Path 2 ranking unchanged aside from difficulty rename).
- Client-only pagination over a full dump.
- Preserving `updated_at` as a catalog sort option.
- Multi-user shared catalogs or public URLs beyond owner session.

## Decisions

### 1. Full rename (column + API + UI)

- **Choice:** Alembic `RENAME COLUMN importance TO difficulty`; Pydantic/TS fields; Ask body; components `Importance*` → `Difficulty*`; i18n keys under `common.difficulty` with hard/medium/easy.
- **Why:** Product language must match code; partial rename creates lasting confusion.
- **Alternatives:** UI-only label change; API alias while keeping DB column — rejected.

### 2. List response envelope

```json
{
  "items": [ /* PracticeNoteOut */ ],
  "total": 42,
  "page": 1,
  "page_size": 8
}
```

- **Choice:** Always return this object from `GET /notes` (breaking).
- **Why:** Pagination needs `total`; clients already go through one Notes page + BFF.
- **Alternatives:** Separate `/notes/count`; Link headers — rejected for simplicity.

### 3. Query parameter contract

| Param | Role |
|-------|------|
| `q`, `tags`, `difficulty` | Same semantics as today’s title/tags/importance |
| `practiced_from`, `practiced_to` | ISO calendar dates (`YYYY-MM-DD`) or timestamptz; inclusive local-day bounds |
| `sort` | `learning` \| `difficulty` \| `practiced` (default `learning`) |
| `order` | `asc` \| `desc`; meaningful for `difficulty`; ignored for `learning`/`practiced` (fixed directions) |
| `page` | 1-based; default 1 |
| `page_size` | Fixed 8 server-side (ignore or clamp client overrides) |

Remove product use of `created_*` / `updated_*` / `importance*` / `importance_min|max`. Drop legacy params from the handler when renaming.

### 4. Learning-path ordinal

- **Choice:** Primary key = minimum index of note tags in the shared `PRESET_TAGS` order (backend mirrors the same ordered id list as the frontend). Notes with no preset tag sort last (sentinel). Tie-break: `title ASC`, then `id ASC`.
- **Why:** Matches “学习顺序”; multi-tag → earliest topic in the curriculum.
- **Alternatives:** First tag in array order; group UI headers — deferred.

Backend should keep a single constant list aligned with `PRESET_TAGS` (duplicate constant or shared JSON later; for now duplicate with a comment to keep in sync).

### 5. Practiced range semantics

- **Choice:** Note matches if **any** `review_dates` element falls in `[start_of_day(from), end_of_day(to)]` in the **client's local calendar interpretation**, sent as UTC ISO bounds computed on the frontend before the request (or send `YYYY-MM-DD` and interpret as UTC date if timezone is awkward—prefer frontend converting local day → UTC ISO for correctness).
- **Why:** “上周刷过的题” ≠ created/updated.
- **Alternatives:** Filter on `max(review_dates)` only inside range — rejected (misses older practices in range).

### 6. Filter interaction matrix

| Control | Apply |
|---------|--------|
| Title, tags, practiced range | Commit on Search / Enter |
| Difficulty multi-select | Live refetch with last committed title/tags/range |
| Sort / order | Live refetch; reset `page` to 1 |
| Page | Live; update URL |

### 7. URL as browse source of truth

Sync: `q`, `tags`, `difficulty`, `practiced_from`, `practiced_to`, `sort`, `order`, `page`. Draft title/tags/range stay in component state until Search. On filter/sort change, reset `page=1`. Use Next.js `useSearchParams` / `router.replace` to avoid history spam on every difficulty toggle (replace vs push: **replace** for live difficulty/sort; **push** optional for page clicks—prefer **replace** everywhere for a tool UI unless back-through-pages is desired; **decision: replace for all browse updates**, push only if we later want page history).

### 8. HeroUI composition

- Pagination: compound `Pagination` / `Content` / `Item` / `Link` / `Previous` / `Next` / `Ellipsis` / optional `Summary`; app owns `page` and `totalPages = ceil(total/8)`.
- DateRangePicker: compose `DateField` + `RangeCalendar` per HeroUI v3 docs; values via `@internationalized/date` `CalendarDate`.

## Risks / Trade-offs

- **[Risk] Learning ordinal SQL complexity / drift from frontend PRESET_TAGS** → Mitigation: shared ordered id list constant; add a short comment + optional unit test that frontend list matches backend list length/order.
- **[Risk] Breaking list API for any external clients** → Mitigation: only first-party BFF/UI today; update in same PR.
- **[Risk] Timezone off-by-one on practiced range** → Mitigation: frontend sends explicit UTC ISO start/end for local calendar days; document in API.
- **[Risk] Large `unnest(review_dates)` filters without index** → Mitigation: acceptable for personal catalogs; revisit GIN/expression index if slow.
- **[Trade-off] Duplicating PRESET order on backend** → Prefer correctness of server-side sort/pagination over sorting only the current page client-side.

## Migration Plan

1. Alembic: `ALTER TABLE practice_notes RENAME COLUMN importance TO difficulty` (values unchanged).
2. Deploy API + frontend together (breaking field + envelope).
3. Rollback: reverse rename migration; revert clients (no data loss).

## Open Questions

None blocking—defaults above are locked from explore. If `@internationalized/date` is missing from `package.json`, add it when implementing DateRangePicker.