## Why

The Notes catalog still returns an unsorted full list ordered only by `updated_at`, with no pagination and no way to browse by learning-path order, difficulty, or recent practice. The field is labeled “importance,” which does not match how the owner thinks about problems (difficulty). Date-range lookup was removed from Path 1 earlier, but practice-day ranges on `review_dates` are now a useful way to find “what I did last week.”

## What Changes

- **BREAKING**: Rename `importance` → `difficulty` across the data model, APIs (Notes list + Ask pre-filter), schemas, frontend types/components/i18n (难/中/易 · Hard/Medium/Easy). Numeric scale stays `1|2|3` (higher = harder).
- Notes list gains **server-side pagination** (fixed page size 8) with a paginated response envelope (`items` + `total` + page metadata).
- Notes list gains **sort modes**: learning-path (default; primary tag = earliest `PRESET_TAGS` ordinal), difficulty ascending/descending, recently practiced (`max(review_dates)`).
- Notes list reintroduces an optional **practiced date-range** filter (HeroUI `DateRangePicker`): match notes whose `review_dates` intersect the committed range; applied only on Search/Enter with title/tags.
- Difficulty multi-select remains **live refetch** (same interaction as today’s importance filter).
- Browse state (committed filters, sort/order, page) is **synced to the URL** for refresh/share/back-forward.
- **BREAKING** (list API shape): `GET /notes` returns a paginated object instead of a bare `PracticeNote[]`.
- Drop implicit `updated_at DESC` as the catalog default; remove unused created/updated date-range as Path 1 product axes (API may drop or leave unused).

## Capabilities

### New Capabilities

- `notes-list-browse`: Paginated Notes catalog browsing—sort modes, practiced date-range filter, URL-synced page state, and HeroUI Pagination UI.

### Modified Capabilities

- `practice-notes`: Entry model and UI copy rename `importance` → `difficulty` (levels Hard/Medium/Easy).
- `note-retrieval`: Path 1/Ask filters use `difficulty` membership; Path 1 allows optional practiced date-range; remove the prohibition on date-range UI; list responses are paginated and sortable.

## Impact

- Backend: Alembic rename column; `PracticeNote` entity/schemas; `GET /notes` query params (`sort`, `order`, `page`, `practiced_from`/`practiced_to`, `difficulty`); Ask request body field rename; list response envelope.
- Frontend: Notes list page (filters, sort control, DateRangePicker, Pagination); rename `Importance*` → `Difficulty*`; Ask page filter; messages en/zh-CN; optional URL searchParams sync helpers.
- Specs: `note-retrieval` and `practice-notes` requirement deltas; new `notes-list-browse` capability.
- Dependencies: HeroUI `DateRangePicker`, `Pagination`, and date calendar types (`@internationalized/date` if not already present).
