import type { PracticeNote } from "@/lib/types";
import { ALL_IMPORTANCE_LEVELS, type ImportanceLevel } from "@/lib/importance";

export type AskResult = { notes: PracticeNote[]; answer: string | null };

export type AskUiState = {
  question: string;
  tags: string[];
  importance: ImportanceLevel[];
  result: AskResult | null;
  notesExpanded: boolean;
  error: string;
};

const STORAGE_KEY = "algonote:ask-ui";

const EMPTY: AskUiState = {
  question: "",
  tags: [],
  importance: [...ALL_IMPORTANCE_LEVELS],
  result: null,
  notesExpanded: false,
  error: "",
};

/** Survives client-side route changes while the JS bundle stays loaded. */
let memory: AskUiState | null = null;

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function parseImportance(raw: unknown): ImportanceLevel[] {
  if (!Array.isArray(raw)) return [...ALL_IMPORTANCE_LEVELS];
  const levels = raw
    .map((value) => Number(value))
    .filter((value): value is ImportanceLevel => value === 1 || value === 2 || value === 3);
  return levels.length ? ALL_IMPORTANCE_LEVELS.filter((level) => levels.includes(level)) : [...ALL_IMPORTANCE_LEVELS];
}

export function loadAskUiState(): AskUiState {
  if (memory) return memory;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AskUiState> & { tags?: unknown };
        memory = {
          question: typeof parsed.question === "string" ? parsed.question : "",
          tags: parseTags(parsed.tags),
          importance: parseImportance(parsed.importance),
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
  memory = { ...EMPTY, tags: [], importance: [...ALL_IMPORTANCE_LEVELS] };
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
  memory = { ...EMPTY, tags: [], importance: [...ALL_IMPORTANCE_LEVELS] };
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
