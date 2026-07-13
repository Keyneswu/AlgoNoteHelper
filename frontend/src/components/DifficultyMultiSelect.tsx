"use client";

import { useTranslations } from "next-intl";
import { DifficultyIcon } from "@/components/DifficultyBadge";
import {
  ALL_DIFFICULTY_LEVELS,
  DIFFICULTY_LEVELS,
  type DifficultyLevel,
} from "@/lib/difficulty";

type DifficultyMultiSelectProps = {
  value: DifficultyLevel[];
  onChange: (value: DifficultyLevel[]) => void;
  showLegend?: boolean;
  legend?: string;
};

export function DifficultyMultiSelect({
  value,
  onChange,
  showLegend = true,
  legend,
}: DifficultyMultiSelectProps) {
  const t = useTranslations("common");
  const selected = new Set(value.length ? value : ALL_DIFFICULTY_LEVELS);

  function toggle(level: DifficultyLevel) {
    const next = new Set(selected);
    if (next.has(level)) {
      if (next.size <= 1) return;
      next.delete(level);
    } else {
      next.add(level);
    }
    onChange(ALL_DIFFICULTY_LEVELS.filter((item) => next.has(item)));
  }

  return (
    <fieldset className="space-y-2">
      {showLegend && (
        <legend className="text-sm font-medium text-foreground/90">
          {legend ?? t("fields.difficulty")}
        </legend>
      )}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={legend ?? t("fields.difficulty")}
      >
        {DIFFICULTY_LEVELS.map((level) => {
          const active = selected.has(level.value);
          const label = t(`difficulty.${level.labelKey}`);
          return (
            <button
              key={level.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(level.value)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                active
                  ? `${level.badgeClass} ring-2`
                  : "bg-inset text-muted ring-border hover:bg-raised"
              }`}
            >
              <DifficultyIcon
                value={level.value}
                className={`size-3.5 ${active ? level.iconClass : "text-muted"}`}
              />
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
