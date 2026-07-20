import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InlineMarkdownField } from "@/components/InlineMarkdownField";

const labels = {
  edit: "Edit",
  source: "Source",
  preview: "Preview",
  complete: "Complete",
  cancel: "Cancel",
  empty: "Add content",
  expand: "Show more",
  collapse: "Show less",
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Markdown by default and activates only via Edit", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    expect(screen.getByRole("heading", { name: "Goal" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("markdown-activation")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("markdown-reading"));
    expect(props.onEdit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("does not activate when rendered Markdown descendants are clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    await user.click(screen.getByRole("heading", { name: "Goal" }));
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("keeps rendered link interaction without entering edit mode", async () => {
    const user = userEvent.setup();
    const { props } = renderField();

    await user.click(screen.getByRole("button", { name: "link" }));
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("does not activate from keyboard on the reading surface", () => {
    const { props } = renderField();

    fireEvent.keyDown(screen.getByTestId("markdown-reading"), { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("markdown-reading"), { key: " " });
    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("can be locked while another local editor owns an unsaved buffer", async () => {
    const user = userEvent.setup();
    const { props } = renderField({ isEditDisabled: true });

    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
    await user.click(screen.getByTestId("markdown-reading"));
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

  it("collapses tall rendered content behind an expand control", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return 600;
      },
    });

    renderField({
      value: Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join("\n\n"),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("markdown-rendered")).toHaveClass("max-h-[50vh]");
    expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more" }));
    expect(screen.getByTestId("markdown-rendered")).not.toHaveClass("max-h-[50vh]");
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("does not show a collapse control for short content", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return 120;
      },
    });

    renderField({ value: "Short statement" });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
    expect(screen.getByTestId("markdown-rendered")).not.toHaveClass("max-h-[50vh]");
  });
});
