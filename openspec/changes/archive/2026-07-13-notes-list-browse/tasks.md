## 1. Rename importance → difficulty (data + API)

- [x] 1.1 Add Alembic migration renaming `practice_notes.importance` → `difficulty` (values unchanged)
- [x] 1.2 Update `PracticeNote` entity, Pydantic create/update/out schemas, and Ask request schemas to use `difficulty`; remove `importance` / `importance_min|max` from list/Ask handlers
- [x] 1.3 Update `GET /notes` and Ask pre-filter code paths to filter on `difficulty` membership
- [x] 1.4 Drop unused list query params `created_*` / `updated_*` from the notes list handler (or leave unused and undocumented—prefer remove)

## 2. Paginated list API with sort and practiced range

- [x] 2.1 Introduce paginated response model (`items`, `total`, `page`, `page_size=8`) and change `GET /notes` return type
- [x] 2.2 Add query params `sort` (`learning`|`difficulty`|`practiced`), `order` (`asc`|`desc`), `page`, and fixed page size 8 with offset slicing
- [x] 2.3 Implement learning-path ordering via shared preset-tag ordinal list (min index; no-preset last; tie-break title, id)
- [x] 2.4 Implement difficulty ordering (asc/desc) and practiced ordering (`max(review_dates)` DESC)
- [x] 2.5 Implement `practiced_from` / `practiced_to` filter (any `review_dates` in inclusive range)
- [x] 2.6 Return correct `total` for the filtered set before pagination

## 3. Frontend rename Importance → Difficulty

- [x] 3.1 Rename `importance.ts` / `Importance*` components to `difficulty` / `Difficulty*` and update all imports (notes, ask, import, resolve, NoteCard, FieldLabel, types)
- [x] 3.2 Update en/zh-CN messages: 重要度→难度, High/Medium/Low→Hard/Medium/Easy (难/中/易); replace `importance` i18n keys
- [x] 3.3 Update Ask store/page and BFF payloads to send `difficulty` instead of `importance`

## 4. Notes list browse UI

- [x] 4.1 Consume paginated envelope; render HeroUI `Pagination` (page size 8) and wire page changes
- [x] 4.2 Add sort control: learning (default), difficulty with asc/desc, practiced; reset page to 1 on change
- [x] 4.3 Add HeroUI `DateRangePicker` for practiced range; commit with title/tags on Search/Enter only
- [x] 4.4 Keep difficulty multi-select as live refetch using last committed title/tags/range
- [x] 4.5 Sync committed browse state to URL (`q`, `tags`, `difficulty`, `practiced_from`/`to`, `sort`, `order`, `page`); hydrate on load; reset page on filter/sort change
- [x] 4.6 Convert local calendar range to UTC ISO bounds (or agreed date params) before calling the API

## 5. Verification

- [x] 5.1 Manual: rename fields round-trip on create/edit/import/ask filters
- [x] 5.2 Manual: learning / difficulty asc|desc / practiced sorts with multi-tag notes
- [x] 5.3 Manual: practiced date range + Search commit; difficulty live toggle; pagination and URL refresh
