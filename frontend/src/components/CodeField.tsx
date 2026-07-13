"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import type { PreferredCodeLanguage } from "@/lib/types";

/** Approx line height used for min/max rem conversion (matches text-sm editor). */
const LINE_REM = 1.5;

const languageSupport = {
  java,
  python,
  cpp,
} as const;

type CodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  language?: PreferredCodeLanguage;
  /** Minimum visible lines (empty / short snippets still get typing room). */
  minRows?: number;
  /** Collapsed cap; longer code scrolls until the user expands. */
  maxRows?: number;
  className?: string;
};

function countLines(value: string): number {
  if (!value) return 1;
  return value.split("\n").length;
}

/**
 * Code editor that grows with content, with a collapsed max height + expand control.
 * Height API: https://github.com/uiwjs/react-codemirror#props (`height` / `minHeight` / `maxHeight`)
 */
export function CodeField({
  value,
  onChange,
  language = "java",
  minRows = 6,
  maxRows = 18,
  className = "",
}: CodeFieldProps) {
  const t = useTranslations("common.codeField");
  const [expanded, setExpanded] = useState(false);

  const lines = countLines(value);
  const cappedMin = Math.max(minRows, 4);
  const cappedMax = Math.max(maxRows, cappedMin);
  const needsToggle = lines > cappedMax;

  useEffect(() => {
    if (!needsToggle && expanded) setExpanded(false);
  }, [needsToggle, expanded]);

  const extensions = useMemo(
    () => [
      languageSupport[language](),
      closeBrackets(),
      bracketMatching(),
      indentOnInput(),
      keymap.of(closeBracketsKeymap),
    ],
    [language],
  );

  const minHeight = `${cappedMin * LINE_REM}rem`;
  // Grow with content; only clamp when collapsed and code exceeds maxRows.
  const maxHeight =
    !expanded && needsToggle ? `${cappedMax * LINE_REM}rem` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="overflow-hidden rounded-lg border border-border bg-inset text-sm">
        <CodeMirror
          value={value}
          height="auto"
          minHeight={minHeight}
          maxHeight={maxHeight}
          theme="dark"
          extensions={extensions}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
        />
      </div>
      {needsToggle ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="tertiary"
            className="text-xs"
            onPress={() => setExpanded((prev) => !prev)}
          >
            {expanded ? t("collapse") : t("expand")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
