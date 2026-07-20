"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertDialog, Button, Card, Form, Input, TextField } from "@heroui/react";
import { AiRewritePanel } from "@/components/AiRewritePanel";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { InlineMarkdownField } from "@/components/InlineMarkdownField";
import { PitfallBlocks } from "@/components/PitfallBlocks";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { NoteTags } from "@/components/NoteTags";
import { PracticeHistory } from "@/components/PracticeHistory";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampDifficulty, type DifficultyLevel } from "@/lib/difficulty";
import { clonePracticeNote, noteDraftIsDirty } from "@/lib/note-draft";
import { normalizePitfalls } from "@/lib/pitfalls";
import { requestApproachGeneration } from "@/lib/rewrite";
import type { NoteDraft, PracticeNote } from "@/lib/types";

type MarkdownField = "statement" | "approach";

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<PracticeNote | null>(null);
  const [savedNote, setSavedNote] = useState<PracticeNote | null>(null);
  const [activeField, setActiveField] = useState<MarkdownField | null>(null);
  const [fieldSnapshot, setFieldSnapshot] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const response = await fetch(`/api/bff/notes/${id}`);
      const data = (await response.json()) as PracticeNote | { error?: string };
      if (!response.ok) setError((data as { error?: string }).error ?? t("errors.couldNotLoad"));
      else {
        const loaded = data as PracticeNote;
        setNote(clonePracticeNote(loaded));
        setSavedNote(clonePracticeNote(loaded));
      }
    })();
  }, [id, session, t]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => (current ? { ...current, [field]: value } : current));
  }

  function beginField(field: MarkdownField) {
    if (!note) return;
    setFieldSnapshot(note[field]);
    setActiveField(field);
  }

  function cancelField(field: MarkdownField) {
    update(field, fieldSnapshot);
    setActiveField(null);
  }

  function statementReadiness(statement: string): "ok" | "empty" | "incomplete" {
    const text = statement.trim();
    if (!text) return "empty";
    if (text.length < 40) return "incomplete";
    return "ok";
  }

  async function generateApproach(): Promise<string> {
    if (!note) throw new Error(t("errors.couldNotGenerateApproach"));
    const readiness = statementReadiness(note.statement);
    if (readiness === "empty") {
      throw new Error(t("errors.statementRequiredForApproach"));
    }
    if (readiness === "incomplete") {
      throw new Error(t("errors.statementIncompleteForApproach"));
    }
    return requestApproachGeneration({
      title: note.title,
      statement: note.statement,
      tags: note.tags,
      code: note.code,
    });
  }

  async function saveNote(andReturn: boolean) {
    if (!note) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/bff/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...note,
        difficulty: clampDifficulty(note.difficulty),
        pitfalls: normalizePitfalls(note.pitfalls),
      }),
    });
    const data = (await response.json()) as PracticeNote | { error?: string };
    setSaving(false);
    if (!response.ok) return setError((data as { error?: string }).error ?? t("errors.couldNotSave"));
    const saved = data as PracticeNote;
    setNote(clonePracticeNote(saved));
    setSavedNote(clonePracticeNote(saved));
    setActiveField(null);
    if (andReturn) router.push("/notes");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveNote(false);
  }

  async function confirmDelete() {
    if (!note) return;
    setDeleting(true);
    setError("");
    const response = await fetch(`/api/bff/notes/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setDeleting(false);
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? t("errors.couldNotDelete"));
      return;
    }
    router.replace("/notes");
  }

  function discardDraft() {
    if (!savedNote) return;
    setNote(clonePracticeNote(savedNote));
    setActiveField(null);
    setError("");
  }

  const dirty = noteDraftIsDirty(savedNote, note);
  const aiLabels = {
    custom: t("ai.custom"),
    instructionPlaceholder: t("ai.instructionPlaceholder"),
    runCustom: t("ai.runCustom"),
    apply: t("ai.apply"),
    discard: t("ai.discard"),
    undo: t("ai.undo"),
    before: t("ai.before"),
    after: t("ai.after"),
    stale: t("ai.stale"),
    errorFallback: t("ai.errorFallback"),
  };
  const markdownLabels = (empty: string) => ({
    edit: t("markdown.edit"),
    source: t("markdown.source"),
    preview: t("markdown.preview"),
    complete: t("markdown.complete"),
    cancel: t("markdown.cancel"),
    empty,
  });
  const pitfallLabels = {
    label: tCommon("fields.pitfalls"),
    add: t("pitfallBlocks.add"),
    remove: t("pitfallBlocks.remove"),
    empty: t("pitfallBlocks.empty"),
    expand: t("pitfallBlocks.expand"),
    collapse: t("pitfallBlocks.collapse"),
  };

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
              <Form className="flex flex-col gap-5" onSubmit={submit}>
                <TextField isRequired name="title" value={note.title} onChange={(value) => update("title", value)}>
                  <FieldLabel kind="title">{tCommon("fields.title")}</FieldLabel>
                  <Input className="!text-xl font-semibold leading-snug" />
                </TextField>
                <InlineMarkdownField
                  kind="statement"
                  label={tCommon("fields.problemStatement")}
                  value={note.statement}
                  isEditing={activeField === "statement"}
                  onEdit={() => beginField("statement")}
                  onChange={(value) => update("statement", value)}
                  onComplete={() => setActiveField(null)}
                  onCancel={() => cancelField("statement")}
                  labels={markdownLabels(t("markdown.emptyStatement"))}
                  actions={
                    <AiRewritePanel
                      field="statement"
                      value={note.statement}
                      context={{ title: note.title }}
                      quickActions={[
                        {
                          operation: "format_markdown",
                          label: t("ai.formatStatement"),
                        },
                      ]}
                      onApply={(value) => update("statement", value)}
                      labels={aiLabels}
                    />
                  }
                />
                <InlineMarkdownField
                  kind="approach"
                  label={tCommon("fields.approach")}
                  value={note.approach}
                  isEditing={activeField === "approach"}
                  onEdit={() => beginField("approach")}
                  onChange={(value) => update("approach", value)}
                  onComplete={() => setActiveField(null)}
                  onCancel={() => cancelField("approach")}
                  labels={markdownLabels(t("markdown.emptyApproach"))}
                  actions={
                    <AiRewritePanel
                      field="approach"
                      value={note.approach}
                      context={{
                        title: note.title,
                        statement: note.statement,
                        tags: note.tags,
                        code: note.code,
                      }}
                      quickActions={[
                        {
                          operation: "organize",
                          label: t("ai.organizeApproach"),
                        },
                      ]}
                      externalActions={[
                        {
                          id: "generate",
                          label: t("generateApproach"),
                          run: generateApproach,
                        },
                      ]}
                      onApply={(value) => update("approach", value)}
                      labels={aiLabels}
                    />
                  }
                />
                <div className="space-y-2">
                  <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                  <CodeField
                    value={note.code}
                    onChange={(value) => update("code", value)}
                    language={codeLanguage}
                    minRows={8}
                    maxRows={22}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
                  <div className="space-y-5">
                    <TagPicker value={note.tags} onChange={(tags) => update("tags", tags)} />
                    <div className="space-y-2">
                      <FieldLabel kind="difficulty">{tCommon("fields.difficulty")}</FieldLabel>
                      <DifficultyPicker
                        value={note.difficulty}
                        onChange={(value: DifficultyLevel) => update("difficulty", value)}
                        showLegend={false}
                      />
                    </div>
                    <PracticeHistory
                      dates={note.review_dates ?? []}
                      onChange={(dates) => update("review_dates", dates)}
                    />
                  </div>
                  <PitfallBlocks
                    value={note.pitfalls}
                    onChange={(value) => update("pitfalls", value)}
                    labels={pitfallLabels}
                  />
                </div>
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
              </Form>
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
