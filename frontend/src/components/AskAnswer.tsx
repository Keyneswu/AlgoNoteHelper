"use client";

import { useTranslations } from "next-intl";
import { Streamdown } from "streamdown";
import { createCodePlugin } from "@streamdown/code";

const code = createCodePlugin({
  themes: ["github-dark", "github-dark"],
});

type AskAnswerProps = {
  markdown: string;
  isStreaming?: boolean;
};

/**
 * Renders Path 2 Ask answers as GFM Markdown with Shiki-highlighted fences.
 * Docs: https://streamdown.ai/docs/plugins/code
 */
export function AskAnswer({ markdown, isStreaming = false }: AskAnswerProps) {
  const t = useTranslations("ask");

  if (!markdown) {
    if (isStreaming) {
      return <p className="text-base leading-7 text-muted">{t("thinking")}</p>;
    }
    return <p className="text-base leading-7 text-foreground">{t("noAnswer")}</p>;
  }

  return (
    <div className="ask-answer text-base leading-7 text-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-inset [&_pre]:p-3 [&_code]:text-sm">
      <Streamdown
        mode={isStreaming ? "streaming" : "static"}
        isAnimating={isStreaming}
        plugins={{ code }}
      >
        {markdown}
      </Streamdown>
    </div>
  );
}
