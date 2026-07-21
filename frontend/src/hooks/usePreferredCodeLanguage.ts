"use client";

import { useEffect, useState } from "react";
import { getLlmConfig } from "@/lib/llm-config";
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
        const data = await getLlmConfig();
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
