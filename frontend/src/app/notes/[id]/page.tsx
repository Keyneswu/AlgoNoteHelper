"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertDialog, Button, Card } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { NoteEditorForm } from "@/components/NoteEditorForm";
import { NoteTags } from "@/components/NoteTags";
import { PracticeHistory } from "@/components/PracticeHistory";
import { useNoteFieldEdit } from "@/hooks/useNoteFieldEdit";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { clonePracticeNote, noteDraftIsDirty } from "@/lib/note-draft";
import { deleteNote, getNote, updateNote } from "@/lib/notes-api";
import type { NoteDraft, PracticeNote } from "@/lib/types";

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { session, isPending } = useRequireSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<PracticeNote | null>(null);
  const [savedNote, setSavedNote] = useState<PracticeNote | null>(null);
  const { activeField, beginField, cancelField, completeField, setActiveField } =
    useNoteFieldEdit(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      try {
        const loaded = await getNote(id);
        setNote(clonePracticeNote(loaded));
        setSavedNote(clonePracticeNote(loaded));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.couldNotLoad"));
      }
    })();
  }, [id, session, t]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => (current ? { ...current, [field]: value } : current));
  }

  async function saveNote(andReturn: boolean) {
    if (!note) return;
    setSaving(true);
    setError("");
    try {
      const saved = await updateNote(id, note);
      setNote(clonePracticeNote(saved));
      setSavedNote(clonePracticeNote(saved));
      setActiveField(null);
      if (andReturn) router.push("/notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.couldNotSave"));
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveNote(false);
  }

  async function confirmDelete() {
    if (!note) return;
    setDeleting(true);
    setError("");
    try {
      await deleteNote(id);
      router.replace("/notes");
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : t("errors.couldNotDelete"));
    }
  }

  function discardDraft() {
    if (!savedNote) return;
    setNote(clonePracticeNote(savedNote));
    setActiveField(null);
    setError("");
  }

  const dirty = noteDraftIsDirty(savedNote, note);

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
            className="px-3 text-accent hover:text-accent"
            onPress={() => router.push("/notes")}
          >
            {tCommon("actions.backToNotes")}
          </Button>
        </div>
        <p className="text-sm font-semibold text-accent">{tCommon("practiceArchive")}</p>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold text-foreground">
            {note?.title ?? t("headingFallback")}
          </h1>
          {note && (
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge value={note.difficulty} showLabel />
              <NoteTags tags={note.tags} emptyLabel="" />
            </div>
          )}
        </div>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {!note ? (
          <p className="text-muted">{t("loading")}</p>
        ) : (
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
                metaLayout="split"
                sideSlot={
                  <PracticeHistory
                    dates={note.review_dates ?? []}
                    onChange={(dates) => update("review_dates", dates)}
                  />
                }
                footerSlot={
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        isPending={saving}
                        isDisabled={deleting}
                        onPress={() => void saveNote(true)}
                      >
                        {t("saveAndReturn")}
                      </Button>
                    </div>
                    <AlertDialog>
                      <Button
                        type="button"
                        variant="danger"
                        isDisabled={saving || deleting}
                      >
                        {t("delete")}
                      </Button>
                      <AlertDialog.Backdrop>
                        <AlertDialog.Container>
                          <AlertDialog.Dialog className="sm:max-w-[400px]">
                            <AlertDialog.CloseTrigger />
                            <AlertDialog.Header>
                              <AlertDialog.Icon status="danger" />
                              <AlertDialog.Heading>{t("deleteHeading")}</AlertDialog.Heading>
                            </AlertDialog.Header>
                            <AlertDialog.Body>
                              <p>{t("deleteConfirm", { title: note.title })}</p>
                            </AlertDialog.Body>
                            <AlertDialog.Footer>
                              <Button slot="close" variant="tertiary" isDisabled={deleting}>
                                {t("deleteCancel")}
                              </Button>
                              <Button
                                variant="danger"
                                isPending={deleting}
                                onPress={() => void confirmDelete()}
                              >
                                {t("delete")}
                              </Button>
                            </AlertDialog.Footer>
                          </AlertDialog.Dialog>
                        </AlertDialog.Container>
                      </AlertDialog.Backdrop>
                    </AlertDialog>
                  </div>
                }
              />
              {dirty && (
                <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/35 bg-surface/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur">
                  <p className="text-sm font-medium text-foreground">
                    {t("dirty.message")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      isDisabled={saving || deleting}
                      onPress={discardDraft}
                    >
                      {t("dirty.discard")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      isPending={saving}
                      isDisabled={deleting}
                      onPress={() => void saveNote(false)}
                    >
                      {t("dirty.save")}
                    </Button>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}
