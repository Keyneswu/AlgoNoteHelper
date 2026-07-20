export type RewriteField = "statement" | "approach";

export type RewriteOperation = "format_markdown" | "organize";

export type FieldRewriteContext = {
  title?: string;
  statement?: string;
  approach?: string;
  tags?: string[];
  code?: string;
};

export type FieldRewriteRequest = {
  field: RewriteField;
  operation: RewriteOperation;
  text: string;
  context?: FieldRewriteContext;
};

async function readRewriteResponse(response: Response): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as {
    rewritten?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || `Rewrite failed (${response.status})`);
  }
  if (typeof data.rewritten !== "string") {
    throw new Error("Rewrite response did not include content");
  }
  return data.rewritten;
}

export async function requestFieldRewrite(
  request: FieldRewriteRequest,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/bff/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  return readRewriteResponse(response);
}

export function isRewriteCandidateStale(
  requestedText: string,
  currentText: string,
): boolean {
  return requestedText !== currentText;
}
