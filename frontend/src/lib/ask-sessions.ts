import { bffFetch } from "@/lib/bff";
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
  return asSessionList(await bffFetch<unknown>(SESSIONS_BASE, NO_STORE));
}

export async function createAskSession(
  body?: AskSessionCreateBody,
): Promise<AskSessionDetail> {
  const data = await bffFetch<unknown>(SESSIONS_BASE, {
    ...NO_STORE,
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  return asSessionDetail(data, "createAskSession");
}

export async function getAskSession(id: number): Promise<AskSessionDetail> {
  const data = await bffFetch<unknown>(`${SESSIONS_BASE}/${id}`, NO_STORE);
  return asSessionDetail(data, "getAskSession");
}

export async function updateAskSession(
  id: number,
  body: AskSessionUpdateBody,
): Promise<AskSessionDetail> {
  const data = await bffFetch<unknown>(`${SESSIONS_BASE}/${id}`, {
    ...NO_STORE,
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return asSessionDetail(data, "updateAskSession");
}

export async function deleteAskSession(id: number): Promise<void> {
  await bffFetch<undefined>(`${SESSIONS_BASE}/${id}`, {
    ...NO_STORE,
    method: "DELETE",
  });
}
