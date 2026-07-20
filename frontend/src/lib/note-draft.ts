import type { NoteDraft, PracticeNote } from "@/lib/types";

const EDITABLE_FIELDS: (keyof NoteDraft)[] = [
  "title",
  "statement",
  "approach",
  "code",
  "pitfalls",
  "tags",
  "difficulty",
  "review_dates",
  "source_meta",
];

export function noteDraftIsDirty(
  saved: PracticeNote | null,
  draft: PracticeNote | null,
): boolean {
  if (!saved || !draft) return false;
  return EDITABLE_FIELDS.some(
    (field) => JSON.stringify(saved[field]) !== JSON.stringify(draft[field]),
  );
}

export function clonePracticeNote(note: PracticeNote): PracticeNote {
  return {
    ...note,
    pitfalls: [...note.pitfalls],
    tags: [...note.tags],
    review_dates: [...note.review_dates],
    source_meta: note.source_meta ? { ...note.source_meta } : null,
  };
}
