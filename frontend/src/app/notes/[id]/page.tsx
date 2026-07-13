"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertDialog, Button, Card, Form, Input, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { NoteTags } from "@/components/NoteTags";
import { PracticeHistory } from "@/components/PracticeHistory";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampDifficulty, type DifficultyLevel } from "@/lib/difficulty";
import { normalizePitfalls, pitfallsFromText } from "@/lib/pitfalls";
import type { NoteDraft, PracticeNote } from "@/lib/types";

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<PracticeNote | null>(null);
  const [baseline, setBaseline] = useState<Pick<PracticeNote, "statement" | "approach" | "code"> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

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
        setNote(loaded);
        setBaseline({
          statement: loaded.statement,
          approach: loaded.approach,
          code: loaded.code,
        });
      }
    })();
  }, [id, session, t]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => (current ? { ...current, [field]: value } : current));
  }

  function reverseField(field: "statement" | "approach" | "code") {
    if (!baseline) return;
    update(field, baseline[field]);
  }

  function statementReadiness(statement: string): "ok" | "empty" | "incomplete" {
    const text = statement.trim();
    if (!text) return "empty";
    if (text.length < 40) return "incomplete";
    return "ok";
  }

  async function rewrite(field: "statement" | "code") {
    if (!note) return;
    setRewriting(field);
    setError("");
    const response = await fetch("/api/bff/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, text: note[field] }),
    });
    const data = (await response.json()) as { rewritten?: string; error?: string };
    setRewriting(null);
    if (!response.ok) return setError(data.error ?? t("errors.couldNotRewrite"));
    update(field, data.rewritten ?? note[field]);
  }

  async function generateApproach() {
    if (!note) return;
    const readiness = statementReadiness(note.statement);
    if (readiness === "empty") {
      setError(t("errors.statementRequiredForApproach"));
      return;
    }
    if (readiness === "incomplete") {
      setError(t("errors.statementIncompleteForApproach"));
      return;
    }
    setRewriting("approach");
    setError("");
    const response = await fetch("/api/bff/rewrite/approach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: note.title,
        statement: note.statement,
        tags: note.tags,
        code: note.code,
      }),
    });
    const data = (await response.json()) as { rewritten?: string; error?: string };
    setRewriting(null);
    if (!response.ok) return setError(data.error ?? t("errors.couldNotGenerateApproach"));
    update("approach", data.rewritten ?? note.approach);
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
    setNote(saved);
    setBaseline({
      statement: saved.statement,
      approach: saved.approach,
      code: saved.code,
    });
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
                <div className="space-y-2">
                  <TextField
                    name="statement"
                    value={note.statement}
                    onChange={(value) => update("statement", value)}
                  >
                    <FieldLabel kind="statement">{tCommon("fields.problemStatement")}</FieldLabel>
                    <TextArea rows={5} className="!text-base leading-relaxed" />
                  </TextField>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isPending={rewriting === "statement"}
                      onPress={() => rewrite("statement")}
                    >
                      {t("rewriteWithAi")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      isDisabled={!baseline || note.statement === baseline.statement}
                      onPress={() => reverseField("statement")}
                    >
                      {t("reverse")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <TextField
                    name="approach"
                    value={note.approach}
                    onChange={(value) => update("approach", value)}
                  >
                    <FieldLabel kind="approach">{tCommon("fields.approach")}</FieldLabel>
                    <TextArea rows={5} className="!text-base leading-relaxed" />
                  </TextField>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isPending={rewriting === "approach"}
                      onPress={() => void generateApproach()}
                    >
                      {t("generateApproach")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      isDisabled={!baseline || note.approach === baseline.approach}
                      onPress={() => reverseField("approach")}
                    >
                      {t("reverse")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                  <CodeField
                    value={note.code}
                    onChange={(value) => update("code", value)}
                    language={codeLanguage}
                    minRows={8}
                    maxRows={22}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isPending={rewriting === "code"}
                      onPress={() => rewrite("code")}
                    >
                      {t("rewriteWithAi")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      isDisabled={!baseline || note.code === baseline.code}
                      onPress={() => reverseField("code")}
                    >
                      {t("reverse")}
                    </Button>
                  </div>
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
                  <TextField
                    name="pitfalls"
                    value={note.pitfalls.join("\n")}
                    onChange={(value) => update("pitfalls", pitfallsFromText(value))}
                    className="sm:min-h-full"
                  >
                    <FieldLabel kind="pitfalls">{tCommon("fields.pitfalls")}</FieldLabel>
                    <TextArea
                      rows={12}
                      className="min-h-[16rem] sm:min-h-[22rem] !text-base leading-relaxed"
                      placeholder={tCommon("placeholders.pitfallsOnePerLine")}
                    />
                  </TextField>
                </div>
                <p className="text-sm text-muted">{t("aiAssistHint")}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" isPending={saving} isDisabled={deleting}>
                      {t("save")}
                    </Button>
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
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}
