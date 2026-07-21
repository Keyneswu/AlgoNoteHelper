"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Popover } from "@heroui/react";
import { Notebook, X } from "lucide-react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { getDifficultyMeta } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

type AskContextChipProps = {
  notes: PracticeNote[];
  onRemove: (noteId: number) => void;
};

export function AskContextChip({ notes, onRemove }: AskContextChipProps) {
  const t = useTranslations("ask");
  const tTags = useTranslations("common.tags");

  if (notes.length === 0) {
    return null;
  }

  const countLabel = t("contextBar.count", { count: notes.length });
  const chipAriaLabel = t("contextChipWithCount", { count: notes.length });

  return (
    <Popover>
      <Button
        size="sm"
        variant="tertiary"
        aria-label={chipAriaLabel}
        className="inline-flex h-auto items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent/15"
      >
        <Notebook className="size-3.5 shrink-0 text-accent" aria-hidden />
        <span>{notes.length}</span>
      </Button>
      <Popover.Content placement="top" className="w-[min(20rem,calc(100vw-2rem))]">
        <Popover.Dialog className="p-0">
          <Popover.Heading className="border-b border-border/70 px-3 py-2.5 text-sm font-semibold">
            {t("contextBar.heading")}
            <span className="ml-1.5 font-normal text-muted">{countLabel}</span>
          </Popover.Heading>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto px-1.5 py-1.5">
            {notes.map((note) => {
              const meta = getDifficultyMeta(note.difficulty);
              const tagPreview = (note.tags ?? []).slice(0, 2).join(", ");
              return (
                <li
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
                    isIconOnly
                    aria-label={t("contextBar.remove")}
                    className="h-7 w-7 shrink-0 min-w-7 text-muted opacity-70 group-hover:opacity-100 hover:text-danger"
                    onPress={() => onRemove(note.id)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
