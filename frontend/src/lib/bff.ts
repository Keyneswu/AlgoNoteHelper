/** Browser-side JSON helper for Next BFF routes under `/api/bff`. */

export class BffError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BffError";
    this.status = status;
  }
}

export async function readBffErrorMessage(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }
  return `Request failed (${response.status})`;
}

/**
 * Fetch JSON from a BFF path. `path` may be `/api/bff/...` or a suffix like `/notes`.
 * Throws `BffError` on non-OK responses. Returns `undefined` as T for 204.
 */
export async function bffFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("/api/bff")
    ? path
    : `/api/bff${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new BffError(response.status, await readBffErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
