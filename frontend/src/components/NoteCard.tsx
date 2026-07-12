import Link from "next/link";
import { Card } from "@heroui/react";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { NoteTags } from "@/components/NoteTags";
import { getImportanceMeta } from "@/lib/importance";
import type { PracticeNote } from "@/lib/types";

type NoteCardProps = {
  note: PracticeNote;
  href?: string;
};

export function NoteCard({ note, href }: NoteCardProps) {
  const meta = getImportanceMeta(note.importance);
  const content = (
    <Card className="border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-sm">
      <Card.Content className="relative overflow-hidden p-0">
        <div className={`absolute inset-y-0 left-0 w-1 ${meta.accentClass}`} aria-hidden />
        <div className="flex items-start gap-3 py-4 pr-4 pl-5">
          <ImportanceBadge value={note.importance} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-semibold text-slate-900 leading-snug">{note.title}</h2>
            <NoteTags tags={note.tags} />
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
      {content}
    </Link>
  );
}
