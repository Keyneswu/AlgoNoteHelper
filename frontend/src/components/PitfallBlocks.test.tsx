import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PitfallBlocks } from "@/components/PitfallBlocks";

const labels = {
  label: "Pitfalls",
  add: "Add",
  remove: "Remove",
  empty: "No pitfalls yet",
  expand: "Show more pitfalls",
  collapse: "Show fewer pitfalls",
};

function Harness({
  initial = ["Keep `dp[0]`.", "Check bounds."],
}: {
  initial?: string[];
}) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <PitfallBlocks value={value} onChange={setValue} labels={labels} />
      <output data-testid="pitfall-value">{JSON.stringify(value)}</output>
    </>
  );
}

describe("PitfallBlocks", () => {
  it("renders always-on multiline textareas for each item", () => {
    render(<Harness />);

    const cards = screen.getAllByTestId("pitfall-block");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]!).getByRole("textbox")).toHaveValue("Keep `dp[0]`.");
    expect(within(cards[1]!).getByRole("textbox")).toHaveValue("Check bounds.");
  });

  it("keeps Enter as a newline inside one item instead of adding another", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["first"]} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.keyboard("{End}{Enter}second");

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["first\nsecond"]),
    );
    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(1);
  });

  it("adds an empty card when Add is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);

    expect(screen.getByText("No pitfalls yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify([""]),
    );
  });

  it("removes only the selected item", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["Check bounds."]),
    );
  });

  it("shows the first six items and expands the rest when there are more than six", async () => {
    const user = userEvent.setup();
    const initial = Array.from({ length: 8 }, (_, i) => `Pitfall ${i + 1}`);
    render(<Harness initial={initial} />);

    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(6);
    expect(screen.queryByDisplayValue("Pitfall 7")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more pitfalls" }));

    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(8);
    expect(screen.getByDisplayValue("Pitfall 7")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pitfall 8")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show fewer pitfalls" }));
    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(6);
  });

  it("updates the draft immediately while typing", () => {
    render(<Harness initial={["old"]} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "updated\nwith break" },
    });

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["updated\nwith break"]),
    );
  });
});
