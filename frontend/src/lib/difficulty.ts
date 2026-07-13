export type DifficultyLevel = 1 | 2 | 3;

export type DifficultyMeta = {
  value: DifficultyLevel;
  /** Stable key for i18n lookup */
  labelKey: "hard" | "medium" | "easy";
  descriptionKey: "hardDesc" | "mediumDesc" | "easyDesc";
  /** Tailwind classes for badge surface (dark-friendly) */
  badgeClass: string;
  /** Tailwind classes for icon stroke/fill */
  iconClass: string;
  /** Left accent bar on cards */
  accentClass: string;
  /** Chip color when using HeroUI for filters */
  chipColor: "danger" | "warning" | "success";
};

/** Higher number = harder. */
export const DIFFICULTY_LEVELS: DifficultyMeta[] = [
  {
    value: 3,
    labelKey: "hard",
    descriptionKey: "hardDesc",
    badgeClass: "bg-red-950/80 text-red-200 ring-red-800",
    iconClass: "text-red-400",
    accentClass: "bg-red-500",
    chipColor: "danger",
  },
  {
    value: 2,
    labelKey: "medium",
    descriptionKey: "mediumDesc",
    badgeClass: "bg-amber-950/80 text-amber-200 ring-amber-800",
    iconClass: "text-amber-400",
    accentClass: "bg-amber-400",
    chipColor: "warning",
  },
  {
    value: 1,
    labelKey: "easy",
    descriptionKey: "easyDesc",
    badgeClass: "bg-emerald-950/80 text-emerald-200 ring-emerald-800",
    iconClass: "text-emerald-400",
    accentClass: "bg-emerald-500",
    chipColor: "success",
  },
];

/** Default filter selection: all levels, Hard → Easy display order. */
export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = DIFFICULTY_LEVELS.map(
  (level) => level.value,
);

export function clampDifficulty(value: number): DifficultyLevel {
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return 2;
}

export function getDifficultyMeta(value: number): DifficultyMeta {
  const level = clampDifficulty(value);
  return DIFFICULTY_LEVELS.find((item) => item.value === level) ?? DIFFICULTY_LEVELS[1]!;
}
