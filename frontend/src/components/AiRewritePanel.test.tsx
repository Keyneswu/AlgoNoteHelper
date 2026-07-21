import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiRewritePanel } from "@/components/AiRewritePanel";

const labels = {
  apply: "Apply",
  discard: "Discard",
  undo: "Undo AI change",
  before: "Before",
  after: "After",
  stale: "The field changed. Run rewrite again.",
  errorFallback: "Could not rewrite",
};

function Harness({ initial = "raw statement" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <textarea
        aria-label="Target"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <AiRewritePanel
        field="statement"
        value={value}
        context={{ title: "Example" }}
        quickActions={[{ operation: "format_markdown", label: "Format Markdown" }]}
        onApply={setValue}
        labels={labels}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

function okResponse(rewritten: string) {
  return new Response(JSON.stringify({ rewritten }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AiRewritePanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reviews a quick-action candidate before applying and supports undo", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse("## Problem")));
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Format Markdown" }));
    expect(await screen.findByText("## Problem")).toBeInTheDocument();
    expect(screen.getByTestId("value")).toHaveTextContent("raw statement");

    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByTestId("value")).toHaveTextContent("## Problem");

    await user.click(screen.getByRole("button", { name: "Undo AI change" }));
    expect(screen.getByTestId("value")).toHaveTextContent("raw statement");
  });

  it("shows a spinning pending indicator on the active action", async () => {
    const user = userEvent.setup();
    let resolveResponse!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
      ),
    );
    render(
      <AiRewritePanel
        field="statement"
        value="raw statement"
        context={{ title: "Example" }}
        quickActions={[
          { operation: "format_markdown", label: "Format Markdown" },
          { operation: "organize", label: "Organize" },
        ]}
        onApply={vi.fn()}
        labels={labels}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Format Markdown" }));

    const formatButton = screen.getByRole("button", { name: /Format Markdown/i });
    expect(formatButton).toHaveAttribute("aria-busy", "true");
    expect(formatButton.querySelector("svg.lucide-loader-circle")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Organize" })).toBeDisabled();

    await act(async () => resolveResponse(okResponse("## Problem")));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Format Markdown" }),
      ).toHaveAttribute("aria-busy", "false");
    });
  });

  it("does not expose custom rewrite controls", () => {
    render(<Harness />);

    expect(
      screen.queryByRole("button", { name: /custom/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/tell ai/i),
    ).not.toBeInTheDocument();
  });

  it("prevents applying a stale response over newer typing", async () => {
    const user = userEvent.setup();
    let resolveResponse!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
      ),
    );
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Format Markdown" }));
    await user.clear(screen.getByRole("textbox", { name: "Target" }));
    await user.type(screen.getByRole("textbox", { name: "Target" }), "newer value");
    await act(async () => resolveResponse(okResponse("old response")));

    expect(await screen.findByText(labels.stale)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(screen.getByTestId("value")).toHaveTextContent("newer value");
  });

  it("discards a candidate without changing the target", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse("candidate")));
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Format Markdown" }));
    await screen.findByText("candidate");
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.queryByText("candidate")).not.toBeInTheDocument();
    expect(screen.getByTestId("value")).toHaveTextContent("raw statement");
  });

  it("reviews externally generated content through the same candidate flow", async () => {
    const user = userEvent.setup();
    const generate = vi.fn().mockResolvedValue("Generated approach");
    render(
      <AiRewritePanel
        field="approach"
        value=""
        context={{ title: "Example", statement: "Complete statement" }}
        quickActions={[]}
        externalActions={[{ id: "generate", label: "Generate approach", run: generate }]}
        onApply={vi.fn()}
        labels={labels}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Generate approach" }));

    expect(generate).toHaveBeenCalledOnce();
    expect(await screen.findByText("Generated approach")).toBeInTheDocument();
  });
});
