"use client";

import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { CalendarPlus, X } from "lucide-react";
import { FieldLabel } from "@/components/FieldLabel";

type PracticeHistoryProps = {
  dates: string[];
  onChange: (dates: string[]) => void;
};

function formatDateChip(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function PracticeHistory({ dates, onChange }: PracticeHistoryProps) {
  const t = useTranslations("notes.detail.practiceHistory");
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";

  const ordered = [...dates].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  function remove(iso: string) {
    onChange(dates.filter((item) => item !== iso));
  }

  function recordPractice() {
    onChange([...dates, new Date().toISOString()]);
  }

  return (
    <div className="space-y-2">
      <FieldLabel kind="practiceHistory">{t("heading")}</FieldLabel>
      <div className="rounded-xl border border-border bg-inset/40 p-3">
        {ordered.length ? (
          <div className="flex flex-wrap gap-1.5">
            {ordered.map((iso) => (
              <span
                key={iso}
                title={new Date(iso).toLocaleString()}
                className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border"
              >
                {formatDateChip(iso, locale)}
                <button
                  type="button"
                  aria-label={t("removeAriaLabel", { date: formatDateChip(iso, locale) })}
                  className="inline-flex rounded-full p-0.5 text-muted hover:bg-inset hover:text-foreground"
                  onClick={() => remove(iso)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("empty")}</p>
        )}
        <div className="mt-3">
          <Button type="button" size="sm" variant="secondary" onPress={recordPractice}>
            <CalendarPlus className="size-3.5" aria-hidden />
            {t("record")}
          </Button>
          <p className="mt-1.5 text-xs text-muted">{t("hint")}</p>
        </div>
      </div>
    </div>
  );
}
