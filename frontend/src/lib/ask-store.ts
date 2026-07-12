import type { PracticeNote } from "@/lib/types";

export type AskResult = { notes: PracticeNote[]; answer: string | null };

export type AskUiState = {
  question: string;
  tags: string;
  result: AskResult | null;
  notesExpanded: boolean;
  error: string;
};

const STORAGE_KEY = "algonote:ask-ui";

const EMPTY: AskUiState = {
  question: "",
  tags: "",
  result: null,
  notesExpanded: false,
  error: "",
};

/** Survives client-side route changes while the JS bundle stays loaded. */
let memory: AskUiState | null = null;

export function loadAskUiState(): AskUiState {
  if (memory) return memory;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AskUiState>;
        memory = {
          question: typeof parsed.question === "string" ? parsed.question : "",
          tags: typeof parsed.tags === "string" ? parsed.tags : "",
          result: parsed.result && typeof parsed.result === "object" ? parsed.result : null,
          notesExpanded: Boolean(parsed.notesExpanded),
          error: typeof parsed.error === "string" ? parsed.error : "",
        };
        return memory;
      }
    } catch {
      // ignore corrupt storage
    }
  }
  memory = { ...EMPTY };
  return memory;
}

export function saveAskUiState(state: AskUiState): void {
  memory = state;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — memory still keeps SPA navigations
  }
}

export function clearAskUiState(): void {
  memory = { ...EMPTY };
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
