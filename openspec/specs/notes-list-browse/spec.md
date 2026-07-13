# notes-list-browse Specification

## Purpose
Paginated Notes catalog browsing: sort modes, practiced date-range filter, URL-synced state, and pagination controls.
## Requirements
### Requirement: Paginated notes catalog
The system SHALL return Notes list results as a paginated envelope containing `items` (the page of practice notes), `total` (count of notes matching the active filters before pagination), `page` (1-based), and `page_size` (fixed at 8). The system MUST apply filters and sort before slicing the page. Out-of-range `page` values MUST yield an empty `items` array with the correct `total` (or clamp to the last page—implementation MUST be consistent and documented; preferred: empty items when page is beyond the last page).

#### Scenario: First page of eight
- **WHEN** a user has more than eight matching notes and requests page 1
- **THEN** the response includes at most eight items, `page_size` 8, and `total` equal to the full match count

#### Scenario: Page beyond results
- **WHEN** a user requests a page higher than the last non-empty page for the current filters
- **THEN** `items` is empty and `total` still reflects the match count

### Requirement: Catalog sort modes
The Notes list API and UI SHALL support three sort modes: `learning` (default), `difficulty`, and `practiced`. For `difficulty`, the client MUST be able to request ascending (easy→hard) or descending (hard→easy) via an `order` parameter. For `learning`, the primary key MUST be the minimum index among the note's tags in the shared preset tag curriculum order; notes with no preset tags MUST sort after notes that have at least one preset tag; ties MUST break by title then id. For `practiced`, the primary key MUST be the maximum timestamp in `review_dates` descending (most recently practiced first). Changing sort or order MUST reset the catalog to page 1.

#### Scenario: Default learning order
- **WHEN** a user opens the Notes catalog with no sort query param
- **THEN** results are ordered by learning-path (earliest preset tag ordinal first)

#### Scenario: Multi-tag uses earliest preset
- **WHEN** a note is tagged both `dp` and `array` and sort is `learning`
- **THEN** that note's primary ordinal is the earlier of those tags in the preset curriculum list

#### Scenario: Difficulty descending
- **WHEN** the user selects difficulty sort with descending order
- **THEN** harder notes (higher difficulty value) appear before easier notes

#### Scenario: Difficulty ascending
- **WHEN** the user selects difficulty sort with ascending order
- **THEN** easier notes appear before harder notes

#### Scenario: Recently practiced
- **WHEN** the user selects practiced sort
- **THEN** notes with a more recent maximum `review_dates` entry appear before older ones

### Requirement: Practiced date-range filter
The Notes catalog SHALL allow an optional practiced date range. A note matches when at least one entry in `review_dates` falls within the inclusive range. Title, tags, and practiced range MUST apply only when the user presses Enter or activates Search. The range MUST NOT use `created_at` or `updated_at` as the matching axis.

#### Scenario: Range matches a practice day
- **WHEN** the user commits a practiced range covering 2026-07-01 through 2026-07-07 and a note has a `review_dates` entry on 2026-07-03
- **THEN** that note is included in the filtered result set (subject to other filters)

#### Scenario: Draft range does not fetch
- **WHEN** the user changes the DateRangePicker without pressing Search or Enter
- **THEN** the list does not reload with the new range until Search/Enter commits it

### Requirement: URL-synced browse state
The Notes catalog UI SHALL keep committed browse state in the URL query string, including at least: title query, tags, difficulty levels, practiced from/to, sort, order, and page. Restoring the URL MUST restore the same committed filters, sort, and page. Changing filters or sort MUST reset `page` to 1 in the URL.

#### Scenario: Refresh restores page and sort
- **WHEN** the user is on page 2 with sort `practiced` and refreshes the browser
- **THEN** the catalog reloads page 2 with practiced sort and the same committed filters

#### Scenario: Filter change resets page
- **WHEN** the user is on page 3 and commits a new title search
- **THEN** the URL page becomes 1 and the first page of the new result set is shown

### Requirement: Pagination control
The Notes catalog UI SHALL present HeroUI Pagination (or equivalent composed pagination) driven by `total` and fixed page size 8, allowing the user to move between pages. Page changes MUST update the URL and refetch the corresponding slice.

#### Scenario: Navigate to next page
- **WHEN** the user activates the next page control while more results exist
- **THEN** the catalog shows the next eight matching notes and the URL page increments
