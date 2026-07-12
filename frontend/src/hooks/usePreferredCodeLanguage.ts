"use client";

import { useEffect, useState } from "react";
import type { PreferredCodeLanguage } from "@/lib/types";

function isPreferredCodeLanguage(value: unknown): value is PreferredCodeLanguage {
  return value === "java" || value === "python" || value === "cpp";
}

/** Loads Settings preferred language; defaults to Java until loaded or on error. */
export function usePreferredCodeLanguage(enabled = true): PreferredCodeLanguage {
  const [language, setLanguage] = useState<PreferredCodeLanguage>("java");

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      try {
        const response = await fetch("/api/bff/llm-config");
        if (!response.ok) return;
        const data = (await response.json()) as { preferred_code_language?: unknown };
        if (isPreferredCodeLanguage(data.preferred_code_language)) {
          setLanguage(data.preferred_code_language);
        }
      } catch {
        // Keep default Java.
      }
    })();
  }, [enabled]);

  return language;
}
