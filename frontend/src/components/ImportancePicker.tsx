"use client";

import { useTranslations } from "next-intl";
import { IMPORTANCE_LEVELS, type ImportanceLevel } from "@/lib/importance";
import { ImportanceIcon } from "@/components/ImportanceBadge";

type ImportancePickerProps = {
  value: number;
  onChange: (value: ImportanceLevel) => void;
  name?: string;
  showLegend?: boolean;
};

export function ImportancePicker({
  value,
  onChange,
  name = "importance",
  showLegend = true,
}: ImportancePickerProps) {
  const t = useTranslations("common");

  return (
    <fieldset className="space-y-2">
      {showLegend && (
        <legend className="text-sm font-medium text-foreground/90">{t("fields.importance")}</legend>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("fields.importance")}>
        {IMPORTANCE_LEVELS.map((level) => {
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
              <ImportanceIcon
                value={level.value}
                className={`size-4 ${selected ? level.iconClass : "text-muted"}`}
              />
              {t(`importance.${level.labelKey}`)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
