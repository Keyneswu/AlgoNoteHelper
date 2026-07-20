"use client";

import { useTranslations } from "next-intl";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";

export type AskRailMode = "sessions" | "notes";

type AskRailToggleProps = {
  value: AskRailMode;
  onChange: (mode: AskRailMode) => void;
  isDisabled?: boolean;
  className?: string;
};

export function AskRailToggle({
  value,
  onChange,
  isDisabled = false,
  className,
}: AskRailToggleProps) {
  const t = useTranslations("ask.sessions");

  return (
    <ToggleButtonGroup
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      isDisabled={isDisabled}
      selectedKeys={new Set([value])}
      onSelectionChange={(keys) => {
        const selected = [...keys][0];
        if (selected === "sessions" || selected === "notes") {
          onChange(selected);
        }
      }}
      aria-label={t("railSessions")}
      className={className}
    >
      <ToggleButton id="sessions">{t("railSessions")}</ToggleButton>
      <ToggleButton id="notes">{t("railNotes")}</ToggleButton>
    </ToggleButtonGroup>
  );
}
