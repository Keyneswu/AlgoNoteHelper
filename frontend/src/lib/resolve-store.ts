import type { NoteDraft, PracticeNote } from "@/lib/types";
import { normalizePitfalls } from "@/lib/pitfalls";

export type ResolveOrigin = "import" | "new";

export type SimilarMatch = {
  note: PracticeNote;
  score: number;
};

export type ResolveSession = {
  origin: ResolveOrigin;
  /** Import candidate key when origin is import */
  candidateKey?: string;
  incoming: NoteDraft;
  matches: SimilarMatch[];
};

let memory: ResolveSession | null = null;

export function loadResolveSession(): ResolveSession | null {
  return memory;
}

export function saveResolveSession(session: ResolveSession): void {
  memory = session;
}

export function clearResolveSession(): void {
  memory = null;
}

export function noteToDraft(note: PracticeNote | NoteDraft): NoteDraft {
  return {
    title: note.title,
    statement: note.statement,
    approach: note.approach,
    code: note.code,
    pitfalls: normalizePitfalls(note.pitfalls ?? []),
    tags: [...(note.tags ?? [])],
    difficulty: note.difficulty,
    review_dates: [...(note.review_dates ?? [])],
    source_meta: note.source_meta ?? null,
  };
}

/** Prefill empty existing fields from incoming; keep non-empty existing. */
export function buildMergeCanvas(existing: NoteDraft, incoming: NoteDraft): NoteDraft {
  const pick = (ex: string, inc: string) => (ex.trim() ? ex : inc);
  return {
    title: pick(existing.title, incoming.title) || incoming.title || existing.title,
    statement: pick(existing.statement, incoming.statement),
    approach: pick(existing.approach, incoming.approach),
    code: pick(existing.code, incoming.code),
    pitfalls: existing.pitfalls.length ? [...existing.pitfalls] : [...incoming.pitfalls],
    tags: existing.tags.length ? [...existing.tags] : [...incoming.tags],
    difficulty: existing.difficulty || incoming.difficulty,
    review_dates: [...existing.review_dates],
    source_meta: existing.source_meta ?? incoming.source_meta ?? null,
  };
}
