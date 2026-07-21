## Context

AlgoNoteHelper’s notes UX (create, edit, import, resolve, ask, settings) and FastAPI notes/retrieval layer grew by feature. Shared UI atoms (`TagPicker`, `InlineMarkdownField`, etc.) already exist, and Ask sessions already use a dedicated client module (`ask-sessions.ts`). Gaps remain: every protected page reimplements session redirect; most client pages hand-roll BFF `fetch` + error parsing; `notes/new` and `notes/[id]` duplicate the same field editor; backend owned-note 404 checks, tag/difficulty filters, and pgvector distance SQL are copy-pasted.

Constraints agreed in explore:
- Behavior-preserving only (no API or intentional UX changes)
- Session guard via hook only (no protected layout / route move)
- Shared form only for create + detail; Resolve/import editors stay separate
- Backend: small public helpers, not a full router→service rewrite

## Goals / Non-Goals

**Goals:**
- One client path for BFF JSON calls and notes CRUD/similar
- One session-gate pattern for protected client pages
- One `NoteEditorForm` owning the create/detail field block, with slots for detail-only chrome
- Backend helpers for owned-note fetch, note filters, and vector distance ordering/filtering
- Ship in two phases so Phase A can land alone if needed

**Non-Goals:**
- Next.js middleware or `(protected)` layout restructuring
- Absorbing Resolve dual-column or import compact editors into `NoteEditorForm`
- Untangling import ↔ resolve in-memory store coupling
- Large service-layer extraction for ai-merge / import / ask prepare
- Caching preferred code language in React context
- Changing HTTP paths, payloads, auth bridging, or i18n keys’ meanings

## Decisions

### 1. Client BFF helper mirrors Ask, not server `apiFetch`

- **Choice:** Add `frontend/src/lib/bff.ts` with `bffFetch<T>()` / error type used by browser code against `/api/bff/...`. Keep `frontend/src/lib/api.ts` as the **server-only** FastAPI bridge (session + internal secret).
- **Why:** Server and client auth models differ; mixing them would pull `next/headers` into client bundles or dilute responsibilities.
- **Alternatives:** Extend `api.ts` for both — rejected (environment split). Only migrate notes pages and leave ask-sessions as-is — acceptable incremental path, but prefer ask-sessions/rewrite to call `bffFetch` when touched so error parsing does not stay forked.

### 2. `notes-api` as thin domain client

- **Choice:** `frontend/src/lib/notes-api.ts` exports `fetchSimilarNotes`, `createNote`, `getNote`, `updateNote`, `deleteNote`, plus a small `serializeNoteDraft` (clamp difficulty + normalize pitfalls) used by create/update (and keep-as-new call sites that already POST the same shape).
- **Why:** Matches the proven `ask-sessions.ts` pattern; pages keep orchestration (similar → resolve handoff) but lose transport duplication.
- **Alternatives:** React Query / SWR layer — out of scope (adds dependency and caching semantics).

### 3. Session guard = `useRequireSession` hook only

- **Choice:** Hook returns `{ session, isPending }` (or equivalent), redirects to `/login` when settled without session, and callers still `return null` while pending/unauthenticated. Apply to existing protected pages; `AppNav` may keep its own `useSession` for chrome.
- **Why:** Removes ~7–8 copy-pasted effects without moving the app router tree.
- **Alternatives:** Protected layout — deferred; higher move risk for little extra compaction in this change.

### 4. LLM config read shared, no language context

- **Choice:** Shared getter (via `bffFetch`) used by Settings load and `usePreferredCodeLanguage`. No app-wide cache; editors may still refetch on mount.
- **Why:** Removes duplicated validation/fetch code without introducing stale-language bugs after Settings save.

### 5. `NoteEditorForm` via slots, not mode flags

- **Choice:** Shared component owns: title, statement + AI rewrite, approach + AI rewrite, code, pitfalls, tags, difficulty, and optional footer/side slots. Pages own: shell (`AppNav`, back link, headings), create submit vs detail save/delete/dirty bar/`PracticeHistory`, and loading/error placement where already different.
- **Supporting hooks (optional but preferred):** `useNoteFieldEdit` for `activeField` / snapshot / begin / cancel; `useNoteEditorLabels` (or labels built once inside the form from `notes.detail` + `common` namespaces) so label object builders are not duplicated.
- **Why:** Create and detail already share the field block; modes would recreate branching. Slots keep detail-only UX intact.
- **Alternatives:** Four-way form including import/resolve — rejected (different interaction models; god-component risk).

### 6. Backend helpers stay public and small

- **Choice:**
  - `get_owned_note(db, note_id, user_id) -> PracticeNote` raising the same 404 used today
  - `apply_note_filters(...)` (or equivalent) for tags + difficulty used by list and ask retrieve
  - Vector literal + distance order/filter helper shared by `retrieval` and `notes_dedup`
  - Prefer a module such as `app/services/notes_query.py` (and optionally `vector_search.py`) so `ask_sessions` can stop importing `retrieval`’s private `_load_context_notes` **if** that helper is moved in the same change when touching loaders; otherwise leave `_load_context_notes` move as a stretch task only if low-risk
- **Why:** Highest-duplication backend spots without rewriting routers.
- **Alternatives:** Full service extraction now — deferred.

### 7. Phased delivery

| Phase | Scope |
|-------|--------|
| **A** | `bff` + `notes-api` + `useRequireSession` + llm-config getter + backend helpers + `SimilarMatch` type unify |
| **B** | `NoteEditorForm` (+ field-edit/labels helpers) wired into `notes/new` and `notes/[id]` only |

Each phase must leave product flows behaviorally equivalent.

## Risks / Trade-offs

- **[Risk] Form extract subtly changes layout/classNames** → Mitigation: move JSX with minimal edits; keep detail grid (`PracticeHistory` side-by-side) in the page or a dedicated slot; manual compare new vs detail after Phase B.
- **[Risk] `bffFetch` error message shape differs from ad-hoc parsers** → Mitigation: match current BFF `{ error }` and fallbacks used by ask-sessions; smoke-test failed create/save.
- **[Risk] Soft-fail similar on create (ignore failed similar response) changes if API wrapper throws** → Mitigation: preserve create-page semantics: similar failure → treat as no matches (or current behavior), do not block create.
- **[Risk] Backend filter/vector helper changes query semantics** → Mitigation: extract string/logic as-is; no threshold or filter rule tweaks in this change.
- **[Trade-off] Hook-only auth leaves residual per-page null gates** → Accepted for safety; layout can follow later.
- **[Trade-off] Resolve/import remain verbose** → Accepted; second pass can extract lower-level draft fields after Form stabilizes.

## Migration Plan

1. Land Phase A behind normal PR/commit; run existing frontend tests + targeted manual paths (login gate, notes list, create with/without similar, ask session list).
2. Land Phase B; manually verify new-note and note-detail editing, AI rewrite, dirty bar, delete, practice history.
3. No DB migration, no env changes, no deploy special steps beyond usual `docker compose up --build` when promoting.
4. Rollback: revert the commit(s); no data migration to undo.

## Open Questions

- None blocking. Stretch: whether to move `_load_context_notes` into `notes_query` in Phase A — do it only if the diff stays small and ask_sessions import cleans up cleanly; otherwise defer.
