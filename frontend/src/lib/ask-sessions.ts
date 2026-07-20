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

const NO_STORE: RequestInit = { cache: "no-store" };

async function readJsonError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error || `Request failed (${response.status})`;
}

function asSessionDetail(data: unknown, action: string): AskSessionDetail {
  if (!data || typeof data !== "object" || typeof (data as AskSessionDetail).id !== "number") {
    throw new Error(`${action} returned an invalid session payload`);
  }
  return data as AskSessionDetail;
}

function asSessionList(data: unknown): AskSessionListOut {
  if (!data || typeof data !== "object") {
    return { items: [] };
  }
  const items = (data as AskSessionListOut).items;
  return { items: Array.isArray(items) ? items : [] };
}

export async function listAskSessions(): Promise<AskSessionListOut> {
  const response = await fetch(SESSIONS_BASE, NO_STORE);
  if (!response.ok) throw new Error(await readJsonError(response));
  return asSessionList(await response.json());
}

export async function createAskSession(
  body?: AskSessionCreateBody,
): Promise<AskSessionDetail> {
  const response = await fetch(SESSIONS_BASE, {
    ...NO_STORE,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(await readJsonError(response));
  return asSessionDetail(await response.json(), "createAskSession");
}

export async function getAskSession(id: number): Promise<AskSessionDetail> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`, NO_STORE);
  if (!response.ok) throw new Error(await readJsonError(response));
  return asSessionDetail(await response.json(), "getAskSession");
}

export async function updateAskSession(
  id: number,
  body: AskSessionUpdateBody,
): Promise<AskSessionDetail> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`, {
    ...NO_STORE,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readJsonError(response));
  return asSessionDetail(await response.json(), "updateAskSession");
}

export async function deleteAskSession(id: number): Promise<void> {
  const response = await fetch(`${SESSIONS_BASE}/${id}`, {
    ...NO_STORE,
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(await readJsonError(response));
  }
}
