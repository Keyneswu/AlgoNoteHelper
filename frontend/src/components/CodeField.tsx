"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { keymap } from "@codemirror/view";
import type { PreferredCodeLanguage } from "@/lib/types";

const languageSupport = {
  java,
  python,
  cpp,
} as const;

type CodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  language?: PreferredCodeLanguage;
  rows?: number;
  className?: string;
};

export function CodeField({
  value,
  onChange,
  language = "java",
  rows = 10,
  className = "",
}: CodeFieldProps) {
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

  const height = `${Math.max(rows, 4) * 1.5}rem`;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white text-sm ${className}`}
    >
      <CodeMirror
        value={value}
        height={height}
        theme="light"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}
