import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "@/app/page";

const { getSession, getNeedsSetup } = vi.hoisted(() => ({
  getSession: vi.fn(),
  getNeedsSetup: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (namespace: string) => (key: string) => {
    const messages: Record<string, string> = {
      "common.brand": "AlgoNoteHelper",
      "landing.headline": "Filter what you know. Ask what you forget.",
      "landing.supporting": "Private algorithm practice notes.",
      "landing.login": "Log in",
      "landing.inviteOnly": "Invite-only.",
      "landing.path1.title": "Structured catalog",
      "landing.path1.blurb": "Filter your archive.",
      "landing.path2.title": "Ask your notes",
      "landing.path2.blurb": "Answer from your archive.",
      "landing.visualPlaceholder": "Preview coming soon",
      "landing.showcase.notes.alt": "Notes catalog with structured filters",
      "landing.showcase.ask.alt": "Grounded Ask conversation using saved notes",
      "landing.showcase.settings.alt": "Private provider and account settings",
      "landing.showcase.notes.label": "01 · Filter",
      "landing.showcase.ask.label": "02 · Ask",
      "landing.showcase.settings.label": "03 · Configure",
    };

    return messages[`${namespace}.${key}`] ?? key;
  }),
}));

vi.mock("@heroui/styles", () => ({
  buttonVariants: vi.fn(() => "button"),
}));

vi.mock("@/components/LocaleSwitcher", () => ({
  LocaleSwitcher: () => <button type="button">Language</button>,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("@/lib/setup-status", () => ({
  getNeedsSetup,
}));

describe("LandingPage", () => {
  beforeEach(() => {
    getNeedsSetup.mockResolvedValue(false);
    getSession.mockResolvedValue(null);
  });

  it("shows the three product views instead of the preview placeholder", async () => {
    render(await LandingPage());

    expect(screen.getByRole("img", { name: "Notes catalog with structured filters" }))
      .toHaveAttribute("src", expect.stringContaining("notes.webp"));
    expect(screen.getByRole("img", { name: "Grounded Ask conversation using saved notes" }))
      .toHaveAttribute("src", expect.stringContaining("ask.webp"));
    expect(screen.getByRole("img", { name: "Private provider and account settings" }))
      .toHaveAttribute("src", expect.stringContaining("settings.webp"));
    expect(screen.queryByText("Preview coming soon")).not.toBeInTheDocument();
  });

  it("pairs the landing brand name with the selected brand mark", async () => {
    const { container } = render(await LandingPage());

    expect(screen.getByText("AlgoNoteHelper")).toBeInTheDocument();
    expect(container.querySelector('img[src*="algonote-icon.svg"]')).toBeInTheDocument();
  });
});
