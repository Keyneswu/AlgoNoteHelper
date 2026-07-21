import { bffFetch } from "@/lib/bff";

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

export async function requestFieldRewrite(
  request: FieldRewriteRequest,
  signal?: AbortSignal,
): Promise<string> {
  const data = await bffFetch<{ rewritten?: string }>("/api/bff/rewrite", {
    method: "POST",
    body: JSON.stringify(request),
    signal,
  });
  if (typeof data.rewritten !== "string") {
    throw new Error("Rewrite response did not include content");
  }
  return data.rewritten;
}

export function isRewriteCandidateStale(
  requestedText: string,
  currentText: string,
): boolean {
  return requestedText !== currentText;
}
