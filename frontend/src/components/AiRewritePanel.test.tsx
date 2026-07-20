import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiRewritePanel } from "@/components/AiRewritePanel";

const labels = {
  custom: "Custom rewrite",
  instructionPlaceholder: "Tell AI what to change",
  runCustom: "Run custom rewrite",
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

  it("sends a bounded custom instruction", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse("Structured statement"));
    vi.stubGlobal("fetch", fetchMock);
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Custom rewrite" }));
    await user.type(
      screen.getByPlaceholderText("Tell AI what to change"),
      "Put assumptions last.",
    );
    expect(
      screen.getByPlaceholderText("Tell AI what to change"),
    ).toHaveAttribute("maxLength", "2000");
    await user.click(screen.getByRole("button", { name: "Run custom rewrite" }));

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.operation).toBe("custom");
    expect(body.instruction).toBe("Put assumptions last.");
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
