import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isRewriteCandidateStale,
  requestFieldRewrite,
  type FieldRewriteRequest,
} from "@/lib/rewrite";

const request: FieldRewriteRequest = {
  field: "statement",
  operation: "format_markdown",
  text: "raw statement",
  context: { title: "Example" },
};

describe("field rewrite client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a typed request and returns rewritten content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ rewritten: "## Problem" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestFieldRewrite(request)).resolves.toBe("## Problem");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bff/rewrite",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
      }),
    );
  });

  it("surfaces the API error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Configure chat credentials" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(requestFieldRewrite(request)).rejects.toThrow(
      "Configure chat credentials",
    );
  });

  it("detects a candidate requested for an older target snapshot", () => {
    expect(isRewriteCandidateStale("before", "before")).toBe(false);
    expect(isRewriteCandidateStale("before", "newer value")).toBe(true);
  });
});
