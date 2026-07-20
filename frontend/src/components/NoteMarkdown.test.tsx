import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoteMarkdown } from "@/components/NoteMarkdown";

describe("NoteMarkdown", () => {
  it("renders static Markdown structure", () => {
    render(
      <NoteMarkdown
        content={"## Assumptions\n\n- Input is not null.\n- Values are integers."}
      />,
    );

    expect(screen.getByRole("heading", { name: "Assumptions" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders inline code inside a pitfall", () => {
    render(<NoteMarkdown content={"Do not overwrite `dp[i - 1]`."} variant="inline" />);

    expect(screen.getByText("dp[i - 1]")).toHaveAttribute(
      "data-streamdown",
      "inline-code",
    );
  });

  it("sanitizes unsafe HTML and URLs", () => {
    const { container } = render(
      <NoteMarkdown
        content={'<script>alert("x")</script>\n\n[unsafe](javascript:alert("x"))'}
      />,
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText(/unsafe/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /unsafe/ })).not.toBeInTheDocument();
  });
});
