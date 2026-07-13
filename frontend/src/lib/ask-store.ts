import type { PracticeNote } from "@/lib/types";
import { ALL_DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/difficulty";

export type AskResult = { notes: PracticeNote[]; answer: string | null };

export type AskUiState = {
  question: string;
  tags: string[];
  difficulty: DifficultyLevel[];
  result: AskResult | null;
  notesExpanded: boolean;
  error: string;
};

const STORAGE_KEY = "algonote:ask-ui";

const EMPTY: AskUiState = {
  question: "",
  tags: [],
  difficulty: [...ALL_DIFFICULTY_LEVELS],
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

function parseDifficulty(raw: unknown): DifficultyLevel[] {
  if (!Array.isArray(raw)) return [...ALL_DIFFICULTY_LEVELS];
  const levels = raw
    .map((value) => Number(value))
    .filter((value): value is DifficultyLevel => value === 1 || value === 2 || value === 3);
  return levels.length ? ALL_DIFFICULTY_LEVELS.filter((level) => levels.includes(level)) : [...ALL_DIFFICULTY_LEVELS];
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
          difficulty: parseDifficulty(parsed.difficulty),
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
  memory = { ...EMPTY, tags: [], difficulty: [...ALL_DIFFICULTY_LEVELS] };
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
  memory = { ...EMPTY, tags: [], difficulty: [...ALL_DIFFICULTY_LEVELS] };
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
