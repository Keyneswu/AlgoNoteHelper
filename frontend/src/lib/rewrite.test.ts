import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isRewriteCandidateStale,
  requestApproachGeneration,
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

  it("requests approach generation through its distinct endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("Generated approach"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestApproachGeneration({
        title: "Example",
        statement: "A complete problem statement with enough detail to solve.",
        tags: ["dp"],
        code: "",
      }),
    ).resolves.toBe("Generated approach");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bff/rewrite/approach",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

function okResponse(rewritten: string) {
  return new Response(JSON.stringify({ rewritten }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
