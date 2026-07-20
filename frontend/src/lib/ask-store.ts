import type { PracticeNote } from "@/lib/types";

export type AskChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/** Thin UX cache only — server sessions own transcript + context ids (D6). */
const ACTIVE_SESSION_KEY = "algonote:ask-active-session-id";

export function getActiveSessionId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: number | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id == null) {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, String(id));
    }
  } catch {
    // quota / private mode
  }
}

export function mergeContextNotes(
  existing: PracticeNote[],
  added: PracticeNote[],
): PracticeNote[] {
  const byId = new Map(existing.map((n) => [n.id, n]));
  const next = [...existing];
  for (const note of added) {
    if (!note || typeof note.id !== "number") continue;
    if (!byId.has(note.id)) {
      byId.set(note.id, note);
      next.push(note);
    }
  }
  return next;
}
