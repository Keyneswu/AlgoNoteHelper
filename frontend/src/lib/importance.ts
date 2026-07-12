export type ImportanceLevel = 1 | 2 | 3;

export type ImportanceMeta = {
  value: ImportanceLevel;
  /** Stable key for i18n lookup */
  labelKey: "high" | "medium" | "low";
  descriptionKey: "highPriority" | "mediumPriority" | "lowPriority";
  /** Tailwind classes for badge surface (dark-friendly) */
  badgeClass: string;
  /** Tailwind classes for icon stroke/fill */
  iconClass: string;
  /** Left accent bar on cards */
  accentClass: string;
  /** Chip color when using HeroUI for filters */
  chipColor: "danger" | "warning" | "success";
};

/** Higher number = more important (keeps API `importance_min` filters working). */
export const IMPORTANCE_LEVELS: ImportanceMeta[] = [
  {
    value: 3,
    labelKey: "high",
    descriptionKey: "highPriority",
    badgeClass: "bg-red-950/80 text-red-200 ring-red-800",
    iconClass: "text-red-400",
    accentClass: "bg-red-500",
    chipColor: "danger",
  },
  {
    value: 2,
    labelKey: "medium",
    descriptionKey: "mediumPriority",
    badgeClass: "bg-amber-950/80 text-amber-200 ring-amber-800",
    iconClass: "text-amber-400",
    accentClass: "bg-amber-400",
    chipColor: "warning",
  },
  {
    value: 1,
    labelKey: "low",
    descriptionKey: "lowPriority",
    badgeClass: "bg-emerald-950/80 text-emerald-200 ring-emerald-800",
    iconClass: "text-emerald-400",
    accentClass: "bg-emerald-500",
    chipColor: "success",
  },
];

export function clampImportance(value: number): ImportanceLevel {
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return 2;
}

export function getImportanceMeta(value: number): ImportanceMeta {
  const level = clampImportance(value);
  return IMPORTANCE_LEVELS.find((item) => item.value === level) ?? IMPORTANCE_LEVELS[1]!;
}
