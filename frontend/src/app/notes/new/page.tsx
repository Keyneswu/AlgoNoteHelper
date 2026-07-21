"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { askIconProps, PendingLabel } from "@/components/icons";
import { NoteEditorForm } from "@/components/NoteEditorForm";
import { useNoteFieldEdit } from "@/hooks/useNoteFieldEdit";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { useRequireSession } from "@/hooks/useRequireSession";
import {
  createNote,
  fetchSimilarNotes,
} from "@/lib/notes-api";
import { normalizePitfalls } from "@/lib/pitfalls";
import { noteToDraft, saveResolveSession } from "@/lib/resolve-store";
import { emptyNote, type NoteDraft } from "@/lib/types";

export default function NewNotePage() {
  const t = useTranslations("notes.new");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { session, isPending } = useRequireSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<NoteDraft>(emptyNote);
  const { activeField, beginField, cancelField, completeField } = useNoteFieldEdit("statement");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const matches = await fetchSimilarNotes(note, 3);
      if (matches.length) {
        saveResolveSession({
          origin: "new",
          incoming: noteToDraft({
            ...note,
            pitfalls: normalizePitfalls(note.pitfalls),
          }),
          matches,
        });
        setSaving(false);
        router.push("/notes/resolve");
        return;
      }
      const created = await createNote(note);
      router.replace(`/notes/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.couldNotCreate"));
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-6xl p-5">
        <div className="mb-4">
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            isIconOnly
            aria-label={tCommon("actions.backToNotes")}
            className="text-accent hover:text-accent"
            onPress={() => router.push("/notes")}
          >
            <ArrowLeft {...askIconProps()} />
          </Button>
        </div>
        <p className="text-sm font-semibold text-accent">{tCommon("practiceArchive")}</p>
        <h1 className="mb-6 text-3xl font-semibold text-foreground">{t("heading")}</h1>
        <Card className="border border-border bg-surface">
          <Card.Content>
            <NoteEditorForm
              note={note}
              onChange={update}
              codeLanguage={codeLanguage}
              activeField={activeField}
              onBeginField={(field) => beginField(field, note[field])}
              onCompleteField={completeField}
              onCancelField={(field) =>
                cancelField(field, (value) => update(field, value))
              }
              onSubmit={submit}
              metaLayout="stack"
              titleInputPlaceholder={tCommon("placeholders.titleExample")}
              error={error}
              footerSlot={
                <Button type="submit" isPending={saving}>
                  {({ isPending }) => (
                    <PendingLabel pending={isPending}>{t("submit")}</PendingLabel>
                  )}
                </Button>
              }
            />
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
