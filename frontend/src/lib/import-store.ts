import type { NoteDraft, PracticeNote } from "@/lib/types";

export type SimilarMatchSummary = {
  note: PracticeNote;
  score: number;
};

export type ImportCandidate = NoteDraft & {
  key: string;
  matches?: SimilarMatchSummary[];
  /** Set after resolve Save merge — commit must skip this candidate */
  mergedNoteId?: number;
};

export type ImportUiState = {
  markdown: string;
  candidates: ImportCandidate[];
  /** Accordion expanded ids (serializable). */
  expandedKeys: string[];
  error: string;
};

/**
 * In-memory only: survives App Router client navigations while the bundle
 * stays loaded; clears on full page refresh (new JS context).
 */
let memory: ImportUiState | null = null;

const EMPTY: ImportUiState = {
  markdown: "",
  candidates: [],
  expandedKeys: [],
  error: "",
};

export function loadImportUiState(): ImportUiState {
  if (memory) return memory;
  memory = {
    markdown: "",
    candidates: [],
    expandedKeys: [],
    error: "",
  };
  return memory;
}

export function saveImportUiState(state: ImportUiState): void {
  memory = state;
}

export function clearImportUiState(): void {
  memory = {
    markdown: "",
    candidates: [],
    expandedKeys: [],
    error: "",
  };
}

export { EMPTY as emptyImportUiState };
