import type { PracticeNote } from "@/lib/types";
import { ALL_DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/difficulty";

export type AskChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AskSessionState = {
  tags: string[];
  difficulty: DifficultyLevel[];
  contextNotes: PracticeNote[];
  /** Best-effort transcript for LocalRuntime initialMessages. */
  messages: AskChatMessage[];
};

const STORAGE_KEY = "algonote:ask-session";

const EMPTY: AskSessionState = {
  tags: [],
  difficulty: [...ALL_DIFFICULTY_LEVELS],
  contextNotes: [],
  messages: [],
};

/** Survives client-side route changes while the JS bundle stays loaded. */
let memory: AskSessionState | null = null;

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
  return levels.length
    ? ALL_DIFFICULTY_LEVELS.filter((level) => levels.includes(level))
    : [...ALL_DIFFICULTY_LEVELS];
}

function parseNotes(raw: unknown): PracticeNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((n): n is PracticeNote => {
    return Boolean(n && typeof n === "object" && typeof (n as PracticeNote).id === "number");
  });
}

function parseMessages(raw: unknown): AskChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: AskChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as AskChatMessage).role;
    const content = (item as AskChatMessage).content;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof content === "string" &&
      content.trim()
    ) {
      out.push({ role, content });
    }
  }
  return out;
}

export function loadAskSession(): AskSessionState {
  if (memory) return memory;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AskSessionState>;
        memory = {
          tags: parseTags(parsed.tags),
          difficulty: parseDifficulty(parsed.difficulty),
          contextNotes: parseNotes(parsed.contextNotes),
          messages: parseMessages(parsed.messages),
        };
        return memory;
      }
    } catch {
      // ignore corrupt storage
    }
  }
  memory = {
    ...EMPTY,
    tags: [],
    difficulty: [...ALL_DIFFICULTY_LEVELS],
    contextNotes: [],
    messages: [],
  };
  return memory;
}

export function saveAskSession(state: AskSessionState): void {
  memory = state;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — memory still keeps SPA navigations
  }
}

export function clearAskSession(): void {
  memory = {
    ...EMPTY,
    tags: [],
    difficulty: [...ALL_DIFFICULTY_LEVELS],
    contextNotes: [],
    messages: [],
  };
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function mergeContextNotes(
  existing: PracticeNote[],
  added: PracticeNote[],
): PracticeNote[] {
  const byId = new Map(existing.map((n) => [n.id, n]));
  const next = [...existing];
  for (const note of added) {
    if (!byId.has(note.id)) {
      byId.set(note.id, note);
      next.push(note);
    }
  }
  return next;
}
