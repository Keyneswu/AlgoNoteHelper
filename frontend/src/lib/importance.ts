export type ImportanceLevel = 1 | 2 | 3;

export type ImportanceMeta = {
  value: ImportanceLevel;
  label: string;
  /** Short accessible name for aria-label */
  description: string;
  /** Tailwind classes for badge surface */
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
    label: "High",
    description: "High priority",
    badgeClass: "bg-red-50 text-red-800 ring-red-200",
    iconClass: "text-red-600",
    accentClass: "bg-red-500",
    chipColor: "danger",
  },
  {
    value: 2,
    label: "Medium",
    description: "Medium priority",
    badgeClass: "bg-amber-50 text-amber-900 ring-amber-200",
    iconClass: "text-amber-600",
    accentClass: "bg-amber-400",
    chipColor: "warning",
  },
  {
    value: 1,
    label: "Low",
    description: "Low priority",
    badgeClass: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    iconClass: "text-emerald-600",
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
  return IMPORTANCE_LEVELS.find((item) => item.value === level) ?? IMPORTANCE_LEVELS[1];
}
