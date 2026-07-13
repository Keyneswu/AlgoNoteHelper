"use client";

import { useTranslations } from "next-intl";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/difficulty";
import { DifficultyIcon } from "@/components/DifficultyBadge";

type DifficultyPickerProps = {
  value: number;
  onChange: (value: DifficultyLevel) => void;
  name?: string;
  showLegend?: boolean;
};

export function DifficultyPicker({
  value,
  onChange,
  name = "difficulty",
  showLegend = true,
}: DifficultyPickerProps) {
  const t = useTranslations("common");

  return (
    <fieldset className="space-y-2">
      {showLegend && (
        <legend className="text-sm font-medium text-foreground/90">{t("fields.difficulty")}</legend>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("fields.difficulty")}>
        {DIFFICULTY_LEVELS.map((level) => {
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              name={name}
              aria-checked={selected}
              onClick={() => onChange(level.value)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                selected
                  ? `${level.badgeClass} ring-2`
                  : "bg-inset text-muted ring-border hover:bg-raised"
              }`}
            >
              <DifficultyIcon
                value={level.value}
                className={`size-4 ${selected ? level.iconClass : "text-muted"}`}
              />
              {t(`difficulty.${level.labelKey}`)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
