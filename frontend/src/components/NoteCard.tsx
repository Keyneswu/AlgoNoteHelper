"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@heroui/react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { NoteTags } from "@/components/NoteTags";
import { getDifficultyMeta } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

type NoteCardProps = {
  note: PracticeNote;
  href?: string;
};

export function NoteCard({ note, href }: NoteCardProps) {
  const t = useTranslations("common.tags");
  const meta = getDifficultyMeta(note.difficulty);
  const content = (
    <Card className="border border-border bg-surface transition hover:border-accent/40 hover:shadow-sm hover:shadow-black/30">
      <Card.Content className="relative overflow-hidden p-0">
        <div className={`absolute inset-y-0 left-0 w-1 ${meta.accentClass}`} aria-hidden />
        <div className="flex items-start gap-3 py-4 pr-4 pl-5">
          <DifficultyBadge value={note.difficulty} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-semibold leading-snug text-foreground">{note.title}</h2>
            <NoteTags tags={note.tags} emptyLabel={t("noTags")} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="block rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {content}
    </Link>
  );
}
