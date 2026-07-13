/** Minimal SSE parser for Ask stream events (`notes_added` / `notes` / `token` / `done` / `error`). */

export type AskSseEvent =
  | { type: "notes_added"; notes: unknown }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type AskSseHandlers = {
  onNotesAdded: (notes: unknown) => void;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

function parseDataPayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function parseBlock(block: string): AskSseEvent | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (!dataLines.length && event === "message") return null;
  const raw = dataLines.join("\n");
  const data = parseDataPayload(raw);

  if (event === "notes_added" || event === "notes") {
    return { type: "notes_added", notes: data };
  }
  if (event === "token") {
    return {
      type: "token",
      text: typeof data === "string" ? data : String(data ?? ""),
    };
  }
  if (event === "done") {
    return { type: "done" };
  }
  if (event === "error") {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : typeof data === "string"
          ? data
          : "Stream error";
    return { type: "error", message };
  }
  return null;
}

/**
 * Async-iterate Ask SSE events. Prefers `notes_added`; tolerates legacy `notes`.
 */
export async function* iterateAskSse(response: Response): AsyncGenerator<AskSseEvent> {
  if (!response.body) {
    throw new Error("No stream body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;
  let sawError = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep).replace(/\r/g, "");
      buffer = buffer.slice(sep + 2);
      if (!block.trim()) continue;
      const event = parseBlock(block);
      if (!event) continue;
      if (event.type === "done") sawDone = true;
      if (event.type === "error") sawError = true;
      yield event;
    }
  }

  const trailing = buffer.replace(/\r/g, "").trim();
  if (trailing) {
    const event = parseBlock(trailing);
    if (event) {
      if (event.type === "done") sawDone = true;
      if (event.type === "error") sawError = true;
      yield event;
    }
  }

  if (sawError) {
    throw new Error("Ask stream error event");
  }
  if (!sawDone) {
    throw new Error("Ask stream ended before done");
  }
}

/**
 * Consume a `text/event-stream` body from `POST /ask/stream`.
 * Throws if the stream ends without a `done` event (or after `error`).
 */
export async function consumeAskSse(
  response: Response,
  handlers: AskSseHandlers,
): Promise<void> {
  for await (const event of iterateAskSse(response)) {
    if (event.type === "notes_added") handlers.onNotesAdded(event.notes);
    else if (event.type === "token") handlers.onToken(event.text);
    else if (event.type === "done") handlers.onDone();
    else if (event.type === "error") handlers.onError(event.message);
  }
}
