import { describe, expect, it } from "vitest";
import { clonePracticeNote, noteDraftIsDirty } from "@/lib/note-draft";
import type { PracticeNote } from "@/lib/types";

const saved: PracticeNote = {
  id: 1,
  user_id: "user-1",
  embedding_model: null,
  title: "Example",
  statement: "## Problem",
  approach: "Use DP.",
  code: "",
  pitfalls: ["Check bounds."],
  tags: ["dp"],
  difficulty: 2,
  review_dates: [],
  source_meta: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("existing note draft helpers", () => {
  it("detects Markdown and pitfall draft changes", () => {
    expect(noteDraftIsDirty(saved, saved)).toBe(false);
    expect(noteDraftIsDirty(saved, { ...saved, statement: "# Changed" })).toBe(true);
    expect(
      noteDraftIsDirty(saved, { ...saved, pitfalls: ["Check bounds.", "New"] }),
    ).toBe(true);
  });

  it("clones mutable arrays when restoring the saved baseline", () => {
    const draft = clonePracticeNote(saved);

    expect(draft).toEqual(saved);
    expect(draft).not.toBe(saved);
    expect(draft.tags).not.toBe(saved.tags);
    expect(draft.pitfalls).not.toBe(saved.pitfalls);
    expect(draft.review_dates).not.toBe(saved.review_dates);
  });
});
