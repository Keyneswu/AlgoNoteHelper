import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PitfallBlocks } from "@/components/PitfallBlocks";

const labels = {
  label: "Pitfalls",
  addPlaceholder: "Add a pitfall",
  add: "Add",
  edit: "Edit",
  remove: "Remove",
  complete: "Complete",
  cancel: "Cancel",
  empty: "No pitfalls yet",
};

function Harness({ initial = ["Keep `dp[0]`.", "Check bounds."] }: { initial?: string[] }) {
  const [value, setValue] = useState(initial);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const snapshot = useRef<string[]>(initial);

  return (
    <>
      <PitfallBlocks
        value={value}
        onChange={setValue}
        activeIndex={activeIndex}
        onBeginEdit={(index) => {
          snapshot.current = value;
          setActiveIndex(index);
        }}
        onCompleteEdit={() => setActiveIndex(null)}
        onCancelEdit={() => {
          setValue(snapshot.current);
          setActiveIndex(null);
        }}
        labels={labels}
      />
      <output data-testid="pitfall-value">{JSON.stringify(value)}</output>
    </>
  );
}

describe("PitfallBlocks", () => {
  it("renders each item as an independent inline Markdown block", () => {
    render(<Harness />);

    expect(screen.getByText("dp[0]")).toHaveAttribute("data-streamdown", "inline-code");
    expect(screen.getAllByTestId("pitfall-block")).toHaveLength(2);
  });

  it("adds a trimmed item with Enter", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);

    const composer = screen.getByPlaceholderText("Add a pitfall");
    await user.type(composer, "  New warning  {Enter}");

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["New warning"]),
    );
  });

  it("splits multiline paste into ordered items", () => {
    render(<Harness initial={[]} />);
    const composer = screen.getByPlaceholderText("Add a pitfall");

    fireEvent.paste(composer, {
      clipboardData: { getData: () => "first\n\n second\nthird" },
    });

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["first", "second", "third"]),
    );
  });

  it("edits and completes one selected item", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]!);
    fireEvent.change(screen.getByRole("textbox", { name: "Edit pitfall 2" }), {
      target: { value: "Check both bounds." },
    });
    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["Keep `dp[0]`.", "Check both bounds."]),
    );
  });

  it("preserves spaces while typing before normalizing on Complete", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    const editor = screen.getByRole("textbox", { name: "Edit pitfall 1" });
    await user.clear(editor);
    await user.type(editor, "multi word warning");

    expect(editor).toHaveValue("multi word warning");
    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["Keep `dp[0]`.", "Check bounds."]),
    );

    await user.click(screen.getByRole("button", { name: "Complete" }));
    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["multi word warning", "Check bounds."]),
    );
  });

  it("locks sibling controls until the active edit is completed or cancelled", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);

    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  it("cancels one item edit back to its snapshot", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    fireEvent.change(screen.getByRole("textbox", { name: "Edit pitfall 1" }), {
      target: { value: "Changed" },
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["Keep `dp[0]`.", "Check bounds."]),
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

  it("preserves composer text around a multiline paste", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    const composer = screen.getByPlaceholderText("Add a pitfall");
    await user.type(composer, "prefix suffix");
    (composer as HTMLTextAreaElement).setSelectionRange(7, 7);

    fireEvent.paste(composer, {
      clipboardData: { getData: () => "one\ntwo " },
    });

    expect(screen.getByTestId("pitfall-value")).toHaveTextContent(
      JSON.stringify(["prefix one", "two suffix"]),
    );
  });
});
