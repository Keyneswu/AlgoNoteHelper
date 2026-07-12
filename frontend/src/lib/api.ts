import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET ?? "dev-internal-secret-change-me";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }
  return session;
}

function bridgedHeaders(sessionUserId: string, init?: HeadersInit): Headers {
  const headersInit = new Headers(init);
  headersInit.set("X-User-Id", sessionUserId);
  headersInit.set("X-Internal-Secret", INTERNAL_API_SECRET);
  return headersInit;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await requireSession();
  const url = `${FASTAPI_BASE_URL}${path}`;
  const headersInit = bridgedHeaders(session.user.id, init.headers);
  if (init.body && !headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers: headersInit });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/** Pass-through fetch for SSE / streaming upstream responses (no JSON buffering). */
export async function apiFetchStream(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = await requireSession();
  const url = `${FASTAPI_BASE_URL}${path}`;
  const headersInit = bridgedHeaders(session.user.id, init.headers);
  if (init.body && !headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
  }
  if (!headersInit.has("Accept")) {
    headersInit.set("Accept", "text/event-stream");
  }
  const res = await fetch(url, { ...init, headers: headersInit, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }
  return res;
}
