"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { getDifficultyMeta } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

type AskContextBarProps = {
  notes: PracticeNote[];
  onRemove: (noteId: number) => void;
  /** @deprecated New chat lives in Sessions list; kept optional for compatibility. */
  onNewSession?: () => void;
  /** `rail` = left companion column; `mobile` = compact horizontal strip */
  variant?: "rail" | "mobile";
};

export function AskContextBar({
  notes,
  onRemove,
  variant = "rail",
}: AskContextBarProps) {
  const t = useTranslations("ask");
  const tTags = useTranslations("common.tags");

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-2 overflow-x-auto px-3 pb-2">
        <span className="shrink-0 text-[11px] font-medium tracking-wide text-muted uppercase">
          {t("contextBar.heading")}
          <span className="ml-1 normal-case tracking-normal text-muted">
            {t("contextBar.count", { count: notes.length })}
          </span>
        </span>
        {notes.length === 0 ? (
          <span className="text-xs text-muted">{t("contextBar.empty")}</span>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex shrink-0 items-center gap-1 rounded-full border border-accent/20 bg-accent/10 py-0.5 pr-1 pl-2"
            >
              <Link
                href={`/notes/${note.id}`}
                className="max-w-[9rem] truncate text-xs font-medium text-foreground"
              >
                {note.title}
              </Link>
              <Button
                size="sm"
                variant="tertiary"
                aria-label={t("contextBar.remove")}
                className="h-5 w-5 min-w-5 px-0 text-muted hover:text-danger"
                onPress={() => onRemove(note.id)}
              >
                <span aria-hidden>×</span>
              </Button>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="shrink-0 space-y-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold tracking-wide text-foreground">
            {t("contextBar.heading")}
            <span className="ml-1.5 font-normal text-muted">
              {t("contextBar.count", { count: notes.length })}
            </span>
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t("contextBar.hintShort")}</p>
      </div>

      <div className="mx-4 h-px shrink-0 bg-border/70" aria-hidden />

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {notes.length === 0 ? (
          <p className="px-2 py-6 text-sm leading-relaxed text-muted">{t("contextBar.empty")}</p>
        ) : (
          notes.map((note) => {
            const meta = getDifficultyMeta(note.difficulty);
            const tagPreview = (note.tags ?? []).slice(0, 2).join(", ");
            return (
              <div
                key={note.id}
                className="group relative flex items-center gap-0.5 rounded-xl pr-0.5 transition hover:bg-accent/8"
              >
                <div
                  className={`absolute inset-y-2 left-1 w-0.5 rounded-full opacity-80 ${meta.accentClass}`}
                  aria-hidden
                />
                <Link
                  href={`/notes/${note.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pr-1 pl-3.5 outline-offset-[-2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <DifficultyBadge
                    value={note.difficulty}
                    size="sm"
                    showLabel={false}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-snug text-foreground">
                      {note.title}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-muted">
                      {tagPreview || tTags("noTags")}
                    </p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="tertiary"
                  aria-label={t("contextBar.remove")}
                  className="h-7 w-7 shrink-0 min-w-7 px-0 text-muted opacity-70 group-hover:opacity-100 hover:text-danger"
                  onPress={() => onRemove(note.id)}
                >
                  <span aria-hidden className="text-base leading-none">
                    ×
                  </span>
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
