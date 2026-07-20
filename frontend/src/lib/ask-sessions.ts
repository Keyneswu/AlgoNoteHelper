import type { PracticeNote } from "@/lib/types";

/** Mirrors backend `AskChatMessageOut` / write shape (snake_case from API). */
export type AskSessionMessage = {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

/** Mirrors backend `AskChatSessionListItem`. */
export type AskSessionListItem = {
  id: number;
  title: string;
  updated_at: string;
  created_at?: string | null;
  folder_id?: number | null;
};

/** Mirrors backend `AskChatSessionListOut`. */
export type AskSessionListOut = {
  items: AskSessionListItem[];
};

/** Mirrors backend `AskChatSessionCreate`. */
export type AskSessionCreateBody = {
  title?: string;
  context_note_ids?: number[];
  folder_id?: number | null;
};

/** Mirrors backend `AskChatSessionUpdate`. */
export type AskSessionUpdateBody = {
  title?: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  context_note_ids?: number[];
  folder_id?: number | null;
};

/** Mirrors backend `AskChatSessionOut`. */
export type AskSessionDetail = {
  id: number;
  user_id: string;
  title: string;
  context_note_ids: number[];
  folder_id: number | null;
  created_at: string;
  updated_at: string;
  messages: AskSessionMessage[];
  context_notes: PracticeNote[];
};

const SESSIONS_BASE = "/api/bff/ask/sessions";

async function readJsonError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error || `Request failed (${response.status})`;
}

export async function listAskSessions(): Promise<AskSessionListOut> {
  const response = await fetch(SESSIONS_BASE);
  if (!response.ok) throw new Error(await readJsonError(response));
  return (await response.json()) as AskSessionListOut;
}

export async function createAskSession(
  body?: AskSessionCreateBody,
): Promise<AskSessionDetail> {
  const response = await fetch(SESSIONS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(await readJsonError(response));
  return (await response.json()) as AskSessionDetail;
}

export async function getAskSession(id: number): Promise<AskSessionDetail> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`);
  if (!response.ok) throw new Error(await readJsonError(response));
  return (await response.json()) as AskSessionDetail;
}

export async function updateAskSession(
  id: number,
  body: AskSessionUpdateBody,
): Promise<AskSessionDetail> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readJsonError(response));
  return (await response.json()) as AskSessionDetail;
}

export async function deleteAskSession(id: number): Promise<void> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(await readJsonError(response));
  }
}
