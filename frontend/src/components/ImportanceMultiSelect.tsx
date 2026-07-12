"use client";

import { useTranslations } from "next-intl";
import { ImportanceIcon } from "@/components/ImportanceBadge";
import {
  ALL_IMPORTANCE_LEVELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
} from "@/lib/importance";

type ImportanceMultiSelectProps = {
  value: ImportanceLevel[];
  onChange: (value: ImportanceLevel[]) => void;
  showLegend?: boolean;
  legend?: string;
};

export function ImportanceMultiSelect({
  value,
  onChange,
  showLegend = true,
  legend,
}: ImportanceMultiSelectProps) {
  const t = useTranslations("common");
  const selected = new Set(value.length ? value : ALL_IMPORTANCE_LEVELS);

  function toggle(level: ImportanceLevel) {
    const next = new Set(selected);
    if (next.has(level)) {
      if (next.size <= 1) return;
      next.delete(level);
    } else {
      next.add(level);
    }
    onChange(ALL_IMPORTANCE_LEVELS.filter((item) => next.has(item)));
  }

  return (
    <fieldset className="space-y-2">
      {showLegend && (
        <legend className="text-sm font-medium text-foreground/90">
          {legend ?? t("fields.importance")}
        </legend>
      )}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={legend ?? t("fields.importance")}
      >
        {IMPORTANCE_LEVELS.map((level) => {
          const active = selected.has(level.value);
          const label = t(`importance.${level.labelKey}`);
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
              <ImportanceIcon
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
