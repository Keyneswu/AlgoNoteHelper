"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Streamdown } from "streamdown";
import { createCodePlugin } from "@streamdown/code";

const code = createCodePlugin({
  // Both slots dark: our UI is always dark; OS light mode must not flip Shiki to light.
  // Docs: https://streamdown.ai/docs/plugins/code
  themes: ["github-dark", "github-dark"],
});

type AskAnswerProps = {
  markdown: string;
  isStreaming?: boolean;
};

/**
 * Renders Path 2 Ask answers as GFM Markdown with Shiki-highlighted fences.
 * Docs: https://streamdown.ai/docs/plugins/code
 * Inline / block chrome overrides: `.ask-answer` in globals.css
 */
export function AskAnswer({ markdown, isStreaming = false }: AskAnswerProps) {
  const t = useTranslations("ask");

  if (!markdown) {
    if (isStreaming) {
      return (
        <p className="flex items-center gap-2 text-base leading-7 text-muted">
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          <span>{t("thinking")}</span>
        </p>
      );
    }
    return <p className="text-base leading-7 text-foreground">{t("noAnswer")}</p>;
  }

  return (
    <div className="ask-answer text-base leading-7 text-foreground">
      <Streamdown
        mode={isStreaming ? "streaming" : "static"}
        isAnimating={isStreaming}
        plugins={{ code }}
        components={{
          // Do not forward Streamdown's default `bg-muted` class — our --muted is a text color.
          // Docs: https://streamdown.ai/docs/components
          inlineCode: ({ children }) => (
            <code data-streamdown="inline-code">{children}</code>
          ),
        }}
      >
        {markdown}
      </Streamdown>
    </div>
  );
}
