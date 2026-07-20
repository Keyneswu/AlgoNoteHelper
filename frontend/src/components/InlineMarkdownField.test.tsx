import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InlineMarkdownField } from "@/components/InlineMarkdownField";

const labels = {
  edit: "Edit",
  source: "Source",
  preview: "Preview",
  complete: "Complete",
  cancel: "Cancel",
  empty: "Add content",
};

function renderField(
  overrides: Partial<React.ComponentProps<typeof InlineMarkdownField>> = {},
) {
  const props: React.ComponentProps<typeof InlineMarkdownField> = {
    kind: "statement",
    label: "Problem statement",
    value: "## Goal\n\nRead this [link](https://example.com).",
    isEditing: false,
    onEdit: vi.fn(),
    onChange: vi.fn(),
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    labels,
    ...overrides,
  };
  return { props, ...render(<InlineMarkdownField {...props} />) };
}

describe("InlineMarkdownField", () => {
  it("renders Markdown by default and activates from a non-interactive area", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    expect(screen.getByRole("heading", { name: "Goal" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("markdown-activation"));
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("activates when ordinary rendered Markdown descendants are clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    await user.click(screen.getByRole("heading", { name: "Goal" }));
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("does not activate when a rendered link control is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    await user.click(screen.getByRole("button", { name: "link" }));
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("does not activate while text is selected", () => {
    const { props } = renderField();
    vi.spyOn(window, "getSelection").mockReturnValue({
      toString: () => "selected text",
    } as Selection);

    fireEvent.click(screen.getByTestId("markdown-activation"));
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("supports keyboard activation", () => {
    const { props } = renderField();

    fireEvent.keyDown(screen.getByTestId("markdown-activation"), { key: "Enter" });
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("can be locked while another local editor owns an unsaved buffer", async () => {
    const user = userEvent.setup();
    const { props } = renderField({ isEditDisabled: true });

    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    await user.click(screen.getByTestId("markdown-activation"));
    fireEvent.keyDown(screen.getByTestId("markdown-activation"), { key: "Enter" });
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("edits source, previews it, and exposes complete and cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    renderField({
      value: "**updated**",
      isEditing: true,
      onChange,
      onComplete,
      onCancel,
    });

    const editor = screen.getByRole("textbox");
    fireEvent.change(editor, { target: { value: "# New" } });
    expect(onChange).toHaveBeenLastCalledWith("# New");

    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("updated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Source" }));
    await user.click(screen.getByRole("button", { name: "Complete" }));
    expect(onComplete).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
