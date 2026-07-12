"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

type AskAnswerProps = {
  markdown: string;
  /** When true, Streamdown treats content as still arriving (incomplete fences, etc.). */
  isStreaming?: boolean;
};

/**
 * Renders Path 2 Ask answers as GFM Markdown with Shiki-highlighted fences.
 * Docs: https://streamdown.ai/docs — plugins: code only (no math/mermaid).
 */
export function AskAnswer({ markdown, isStreaming = false }: AskAnswerProps) {
  if (!markdown) {
    if (isStreaming) {
      return <p className="text-base leading-7 text-slate-500">Thinking…</p>;
    }
    return <p className="text-base leading-7 text-slate-800">No answer returned.</p>;
  }

  return (
    <div className="ask-answer text-base leading-7 text-slate-800 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-slate-950 [&_pre]:p-3 [&_code]:text-sm">
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
