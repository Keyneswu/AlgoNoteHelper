import { bffFetch } from "@/lib/bff";
import { clampDifficulty } from "@/lib/difficulty";
import { normalizePitfalls } from "@/lib/pitfalls";
import type { NoteDraft, PracticeNote } from "@/lib/types";

export type SimilarMatch = {
  note: PracticeNote;
  score: number;
};

const NOTES_BASE = "/api/bff/notes";
const NO_STORE: RequestInit = { cache: "no-store" };

/** Shared create/update body shaping (difficulty clamp + pitfalls normalize). */
export function serializeNoteDraft(draft: NoteDraft | PracticeNote) {
  return {
    ...draft,
    difficulty: clampDifficulty(draft.difficulty),
    pitfalls: normalizePitfalls(draft.pitfalls),
  };
}

/**
 * Soft-fail similar lookup: non-OK or network errors yield an empty list
 * (matches create-note behavior before this module).
 */
export async function fetchSimilarNotes(
  draft: Pick<NoteDraft, "title" | "statement">,
  topK = 3,
): Promise<SimilarMatch[]> {
  try {
    const data = await bffFetch<{ matches?: SimilarMatch[] }>(`${NOTES_BASE}/similar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        statement: draft.statement,
        top_k: topK,
      }),
    });
    return data.matches ?? [];
  } catch {
    return [];
  }
}

export async function createNote(draft: NoteDraft): Promise<PracticeNote> {
  return bffFetch<PracticeNote>(NOTES_BASE, {
    method: "POST",
    body: JSON.stringify(serializeNoteDraft(draft)),
  });
}

export async function getNote(id: string | number): Promise<PracticeNote> {
  return bffFetch<PracticeNote>(`${NOTES_BASE}/${id}`, NO_STORE);
}

export async function updateNote(
  id: string | number,
  draft: NoteDraft | PracticeNote,
): Promise<PracticeNote> {
  return bffFetch<PracticeNote>(`${NOTES_BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(serializeNoteDraft(draft)),
  });
}

export async function deleteNote(id: string | number): Promise<void> {
  await bffFetch<void>(`${NOTES_BASE}/${id}`, { method: "DELETE" });
}
