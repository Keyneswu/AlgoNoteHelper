## 1. Data model and migration

- [x] 1.1 Add `review_dates` (`ARRAY(TIMESTAMPTZ)`) to `PracticeNote` entity and Alembic (or project) migration with backfill `ARRAY[created_at]` for existing rows
- [x] 1.2 Extend create/update/out Pydantic schemas and TypeScript `PracticeNote` / `NoteDraft` types to include `review_dates`
- [x] 1.3 On note create (API + import commit path), seed `review_dates` with current timestamp when not provided

## 2. List and Ask API filters

- [x] 2.1 Update `GET /notes`: title `ILIKE` via `q` (or `title`); tags use containment (`@>` / AND); accept repeated `importance` values (`IN`); stop requiring clients to use `importance_min` / date-range for Path 1
- [x] 2.2 Update `POST /ask` (`AskRequest` + retrieval filters) to the same tag AND + importance `IN` semantics
- [x] 2.3 Allow PATCH to replace `review_dates` (append/delete via full list), consistent with tags/pitfalls

## 3. Shared frontend filter controls

- [x] 3.1 Add reusable importance multi-select (default all levels selected; prevent empty selection)
- [x] 3.2 Adapt TagPicker (or compact variant) for list/Ask filter use with preset tags
- [x] 3.3 Update `ask-store` to persist `tags: string[]` and importance selection; migrate or drop legacy comma-string tags

## 4. Notes list UI

- [x] 4.1 Replace filter bar: title field, tag multi-select, importance multi-select; remove date-range inputs
- [x] 4.2 Implement committed `{ title, tags }` on Enter/Search only; live-refetch on importance change using committed query + abort/stale-response guard
- [x] 4.3 Wire BFF query params to new API shape; update i18n for new filter copy

## 5. Ask UI alignment

- [x] 5.1 Replace free-text tags with preset tag multi-select; add importance multi-select
- [x] 5.2 Send aligned tag AND + importance list in Ask request body; update i18n

## 6. Practice history on note detail

- [x] 6.1 Add practice-history block under pitfalls (chips with ×, “record practice” button; no auto-append on view)
- [x] 6.2 Persist via existing save/PATCH flow (or dedicated update); keep layout polished and consistent with tags
- [x] 6.3 Add i18n strings for practice history labels and actions

## 7. Verification

- [x] 7.1 Manually verify Notes: title Search/Enter, tag AND, importance live toggle, no date filters
- [x] 7.2 Manually verify Ask: DP + medium/high pre-filter narrows retrieved notes
- [x] 7.3 Manually verify create seeds a date; append/delete chips; opening detail does not add dates
