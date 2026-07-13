## Context

Import extract → preview → commit and New Note create always INSERT into `practice_notes` with no uniqueness or similarity gate. The catalog already stores per-note embeddings (pgvector) for Path 2 Ask, and `review_dates` for practice history. Users re-import Markdown or recreate nearly the same problem and get silent duplicates.

This change adds soft conflict detection and an optional side-by-side resolve flow for **Import** and **New Note** only (not note detail edit).

## Goals / Non-Goals

**Goals:**
- Soft warn on near-duplicates (top-3); default ignore creates a new note
- Shared resolve UI: existing as editable canvas, incoming as reference; empty fields auto-fill; AI merge + Reverse; Save merges, Keep as new creates
- Merge Save appends `review_dates` and updates fields without a second row
- Per-user unique titles with numeric suffixes on create-as-new
- Soft-fail when embedding is unavailable

**Non-Goals:**
- Conflict flow on `/notes/[id]` edit save
- Silent auto-merge or hard-block duplicates
- OJ/source_key hard identity (optional later)
- Per-field left/right radio “pick a side” UX
- Changing Path 2 Ask ranking behavior beyond reusing vectors

## Decisions

### D1 — Similarity via embedding top-k (title + statement bias)

- **Choice:** Embed the incoming draft with text focused on **title + statement** (approach optional/light). Query the owner's notes with non-null embeddings; return top-3 above a similarity threshold.
- **Why:** Reuses pgvector + BYOK embedding already in the product; better than title-only for bilingual / renumbered titles.
- **Alternatives:** Title ILIKE only (cheap, high false negatives); LLM judge every pair (expensive); OJ URL keys (accurate but sparse coverage).

### D2 — Soft conflict only; ignore = create

- **Choice:** Import shows a Solve affordance before Remove when matches exist; not clicking Solve means commit creates new notes. New Note save redirects to resolve only when matches exist.
- **Why:** Matches “soft reminder” product choice; false positives must not block入库.
- **Alternatives:** Modal always required (more friction); auto-skip high scores (dangerous).

### D3 — Resolve UX: existing canvas, not pick-a-side

- **Choice:** Side-by-side with Incoming read-only reference and Existing editable result. Empty existing fields prefill from incoming. Non-empty fields keep existing until user edits or runs AI merge. Per-field (or per changed field) **Reverse** restores the snapshot of existing at resolve entry. Exits: **Save** (PATCH target + append `review_dates`) or **Keep as new** (POST create, possibly retitled). No per-field side radios.
- **Why:** Strength-2 merge without brittle radio grids; Reverse prevents AI/manual damage.
- **Alternatives:** Field radios; merge = only append `review_dates` and discard draft body.

### D4 — Shared resolve route + component

- **Choice:** One resolve component; route under `/notes/resolve` and/or `/import/resolve` with `from=import|new` and draft payload via sessionStorage / query id (same pattern as import-store).
- **Why:** One conflict UX for both entry points.
- **Alternatives:** Modal-only (harder deep-link/back); two separate pages.

### D5 — AI merge ≠ format-only rewrite

- **Choice:** New chat prompt that receives existing + incoming field text and returns one merged string, **biased toward preserving incoming content** when they conflict. Requires chat credentials; failure surfaces an error without mutating the field.
- **Why:** Format-only rewrite forbids meaning change; merge must synthesize.
- **Alternatives:** Reuse rewrite endpoint with different prompt flag (acceptable if clearly separated in API); client-side concatenation (low quality).

### D6 — Per-user unique titles + suffix

- **Choice:** On create (New Note POST, import commit create-as-new, Keep as new), if `(user_id, title)` collides, assign `Title (2)`, `Title (3)`, … until free. Prefer DB unique constraint or create-time check.
- **Why:** User requested unique titles; ignore path must not 409.
- **Alternatives:** Allow duplicate titles (status quo); require user to rename manually.

### D7 — When to run similarity

- **Choice:** After import extract (batch per candidate) so Solve icons appear; again on New Note save / import commit for unresolved candidates if needed. Editing a candidate mid-preview need not re-query for MVP.
- **Why:** Icons early; save/commit stays correct enough for v1.
- **Alternatives:** Debounced re-check on every title change (more accurate, more cost).

### D8 — Threshold and soft-fail

- **Choice:** Configurable/server-side cosine threshold; if embedding not verified or query fails, return empty matches and proceed without conflict UI.
- **Why:** BYOK embedding is optional for Path 1 browsing today.

## Risks / Trade-offs

- **[Risk] Near-duplicate false positives (Two Sum vs Two Sum II)** → Mitigation: soft ignore default; top-3 picker; user confirms Save.
- **[Risk] False negatives when notes lack embeddings** → Mitigation: soft-fail documented; optionally title exact match as a cheap secondary signal later.
- **[Risk] AI merge corrupts field** → Mitigation: Reverse to existing snapshot; no auto-save until Save/Keep as new.
- **[Risk] Title suffix surprises users** → Mitigation: show final title on Keep as new / commit summary when renamed.
- **[Trade-off] title+statement embed vs full note embed** → Better problem identity vs slightly different from Path 2 document text; acceptable divergence.
- **[Trade-off] Import commit must skip already-merged candidates** → Resolve must mark candidate `merged → noteId` in client state before commit.

## Migration Plan

1. Ship similarity + resolve APIs behind normal deploy; no data backfill required beyond existing embeddings.
2. Optionally add unique index on `(user_id, title)` after backfilling collisions with suffixes (one-off migration script or lazy rename on next write).
3. Rollback: feature flags unused; remove UI entry points; unique index drop if added.

## Open Questions

- Exact cosine threshold (tune after spike on sample notes).
- Whether AI merge is per-field buttons only, or also “merge all conflicted fields”.
- Whether Reverse is per-field only or also a global “reset all” (per-field is enough for MVP if global is cheap to add).
