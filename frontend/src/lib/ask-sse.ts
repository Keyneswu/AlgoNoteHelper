/** Minimal SSE parser for Ask stream events (`notes` / `token` / `done` / `error`). */

export type AskSseHandlers = {
  onNotes: (notes: unknown) => void;
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

/**
 * Consume a `text/event-stream` body from `POST /ask/stream`.
 * Throws if the stream ends without a `done` event (or after `error`).
 */
export async function consumeAskSse(
  response: Response,
  handlers: AskSseHandlers,
): Promise<void> {
  if (!response.body) {
    throw new Error("No stream body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;
  let sawError = false;

  const dispatchBlock = (block: string) => {
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
    if (!dataLines.length && event === "message") return;
    const raw = dataLines.join("\n");
    const data = parseDataPayload(raw);

    if (event === "notes") {
      handlers.onNotes(data);
    } else if (event === "token") {
      handlers.onToken(typeof data === "string" ? data : String(data ?? ""));
    } else if (event === "done") {
      sawDone = true;
      handlers.onDone();
    } else if (event === "error") {
      sawError = true;
      const message =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : typeof data === "string"
            ? data
            : "Stream error";
      handlers.onError(message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, sep).replace(/\r/g, "");
      buffer = buffer.slice(sep + 2);
      if (block.trim()) dispatchBlock(block);
    }
  }

  const trailing = buffer.replace(/\r/g, "").trim();
  if (trailing) dispatchBlock(trailing);

  if (sawError) {
    throw new Error("Ask stream error event");
  }
  if (!sawDone) {
    throw new Error("Ask stream ended before done");
  }
}
