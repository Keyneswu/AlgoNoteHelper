"use client";

import { IMPORTANCE_LEVELS, type ImportanceLevel } from "@/lib/importance";
import { ImportanceIcon } from "@/components/ImportanceBadge";

type ImportancePickerProps = {
  value: number;
  onChange: (value: ImportanceLevel) => void;
  name?: string;
};

export function ImportancePicker({ value, onChange, name = "importance" }: ImportancePickerProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">Importance</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Importance">
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
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <ImportanceIcon
                value={level.value}
                className={`size-4 ${selected ? level.iconClass : "text-slate-400"}`}
              />
              {level.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
