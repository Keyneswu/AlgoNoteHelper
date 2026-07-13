"use client";

import { useTranslations } from "next-intl";
import { getDifficultyMeta } from "@/lib/difficulty";

type DifficultyBadgeProps = {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
};

function DifficultyIcon({ value, className }: { value: number; className?: string }) {
  const level = getDifficultyMeta(value).value;

  if (level === 3) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
        <path
          d="M12 3c1.5 2.2.8 4.2.2 5.4-.4.8-.3 1.3.2 1.8 1.2 1.1 2.6.2 2.6-1.6 2.4 2.1 3.5 4.4 3.5 6.7A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-5.7C5.2 11.4 8.2 8.2 12 3Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M12 14.5c.8 0 1.5.7 1.5 1.6S12.8 18 12 18s-1.5-.8-1.5-1.9.7-1.6 1.5-1.6Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (level === 2) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
        <path
          d="M12 4.5 20.5 19H3.5L12 4.5Z"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 20c-4.2-1.2-7-4.4-7-8.5C5 6.2 9.5 3.5 16.5 4c.2 7.2-2.2 12.6-4.5 16Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 20c0-5 2-9 5.5-12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DifficultyBadge({
  value,
  showLabel = false,
  size = "md",
  className = "",
}: DifficultyBadgeProps) {
  const t = useTranslations("common.difficulty");
  const meta = getDifficultyMeta(value);
  const description = t(meta.descriptionKey);
  const iconSize = size === "sm" ? "size-3.5" : "size-4.5";
  const pad = size === "sm" ? "px-2 py-0.5 gap-1" : "px-2.5 py-1 gap-1.5";

  return (
    <span
      title={description}
      aria-label={description}
      className={`inline-flex items-center rounded-full ring-1 ring-inset ${pad} ${meta.badgeClass} ${className}`}
    >
      <DifficultyIcon value={value} className={`${iconSize} ${meta.iconClass}`} />
      {showLabel && (
        <span className="text-xs font-medium tracking-wide">{t(meta.labelKey)}</span>
      )}
    </span>
  );
}

export { DifficultyIcon };
