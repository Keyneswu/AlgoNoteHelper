"use client";

import { createCodePlugin } from "@streamdown/code";
import { Streamdown } from "streamdown";

const code = createCodePlugin({
  themes: ["github-dark", "github-dark"],
});

type NoteMarkdownProps = {
  content: string;
  variant?: "block" | "inline";
  className?: string;
};

export function NoteMarkdown({
  content,
  variant = "block",
  className = "",
}: NoteMarkdownProps) {
  if (!content.trim()) return null;

  const variantClass =
    variant === "inline"
      ? "[&_p]:m-0 [&_p]:inline [&_pre]:my-1"
      : "space-y-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold";

  return (
    <div
      className={`note-markdown min-w-0 text-base leading-7 text-foreground ${variantClass} ${className}`}
    >
      <Streamdown
        mode="static"
        plugins={{ code }}
        components={{
          inlineCode: ({ children }) => (
            <code data-streamdown="inline-code">{children}</code>
          ),
        }}
      >
        {content}
      </Streamdown>
    </div>
  );
}
