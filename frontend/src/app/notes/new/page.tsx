"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, TextField } from "@heroui/react";
import { AiRewritePanel } from "@/components/AiRewritePanel";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { InlineMarkdownField } from "@/components/InlineMarkdownField";
import { PitfallBlocks } from "@/components/PitfallBlocks";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampDifficulty, type DifficultyLevel } from "@/lib/difficulty";
import { normalizePitfalls } from "@/lib/pitfalls";
import { noteToDraft, saveResolveSession } from "@/lib/resolve-store";
import { requestApproachGeneration } from "@/lib/rewrite";
import { emptyNote, type NoteDraft, type PracticeNote } from "@/lib/types";

type MarkdownField = "statement" | "approach";

export default function NewNotePage() {
  const t = useTranslations("notes.new");
  const tDetail = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<NoteDraft>(emptyNote);
  const [activeField, setActiveField] = useState<MarkdownField | null>("statement");
  const [fieldSnapshot, setFieldSnapshot] = useState("");
  const [activePitfall, setActivePitfall] = useState<number | null>(null);
  const [pitfallSnapshot, setPitfallSnapshot] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => ({ ...current, [field]: value }));
  }

  function beginField(field: MarkdownField) {
    setActivePitfall(null);
    setFieldSnapshot(note[field]);
    setActiveField(field);
  }

  function cancelField(field: MarkdownField) {
    update(field, fieldSnapshot);
    setActiveField(null);
  }

  function beginPitfall(index: number) {
    setActiveField(null);
    setPitfallSnapshot([...note.pitfalls]);
    setActivePitfall(index);
  }

  function statementReadiness(statement: string): "ok" | "empty" | "incomplete" {
    const text = statement.trim();
    if (!text) return "empty";
    if (text.length < 40) return "incomplete";
    return "ok";
  }

  async function generateApproach(): Promise<string> {
    const readiness = statementReadiness(note.statement);
    if (readiness === "empty") {
      throw new Error(tDetail("errors.statementRequiredForApproach"));
    }
    if (readiness === "incomplete") {
      throw new Error(tDetail("errors.statementIncompleteForApproach"));
    }
    return requestApproachGeneration({
      title: note.title,
      statement: note.statement,
      tags: note.tags,
      code: note.code,
    });
  }

  async function createNote(draft: NoteDraft) {
    const response = await fetch("/api/bff/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        difficulty: clampDifficulty(draft.difficulty),
        pitfalls: normalizePitfalls(draft.pitfalls),
      }),
    });
    const data = (await response.json()) as PracticeNote & { error?: string };
    if (!response.ok) throw new Error(data.error ?? t("errors.couldNotCreate"));
    return data;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const similarResponse = await fetch("/api/bff/notes/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          statement: note.statement,
          top_k: 3,
        }),
      });
      const similarData = (await similarResponse.json()) as {
        matches?: { note: PracticeNote; score: number }[];
      };
      const matches = similarResponse.ok ? (similarData.matches ?? []) : [];
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

  const aiLabels = {
    custom: tDetail("ai.custom"),
    instructionPlaceholder: tDetail("ai.instructionPlaceholder"),
    runCustom: tDetail("ai.runCustom"),
    apply: tDetail("ai.apply"),
    discard: tDetail("ai.discard"),
    undo: tDetail("ai.undo"),
    before: tDetail("ai.before"),
    after: tDetail("ai.after"),
    stale: tDetail("ai.stale"),
    errorFallback: tDetail("ai.errorFallback"),
  };
  const markdownLabels = (empty: string) => ({
    edit: tDetail("markdown.edit"),
    source: tDetail("markdown.source"),
    preview: tDetail("markdown.preview"),
    complete: tDetail("markdown.complete"),
    cancel: tDetail("markdown.cancel"),
    empty,
  });
  const pitfallLabels = {
    label: tCommon("fields.pitfalls"),
    addPlaceholder: tDetail("pitfallBlocks.addPlaceholder"),
    add: tDetail("pitfallBlocks.add"),
    edit: tDetail("pitfallBlocks.edit"),
    remove: tDetail("pitfallBlocks.remove"),
    complete: tDetail("pitfallBlocks.complete"),
    cancel: tDetail("pitfallBlocks.cancel"),
    empty: tDetail("pitfallBlocks.empty"),
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
        <h1 className="mb-6 text-3xl font-semibold text-foreground">{t("heading")}</h1>
        <Card className="border border-border bg-surface">
          <Card.Content>
            <Form className="flex flex-col gap-5" onSubmit={submit}>
              <TextField isRequired name="title" value={note.title} onChange={(value) => update("title", value)}>
                <FieldLabel kind="title">{tCommon("fields.title")}</FieldLabel>
                <Input
                  className="!text-xl font-semibold leading-snug"
                  placeholder={tCommon("placeholders.titleExample")}
                />
              </TextField>
              <InlineMarkdownField
                kind="statement"
                label={tCommon("fields.problemStatement")}
                value={note.statement}
                isEditing={activeField === "statement"}
                isEditDisabled={activePitfall !== null}
                onEdit={() => beginField("statement")}
                onChange={(value) => update("statement", value)}
                onComplete={() => setActiveField(null)}
                onCancel={() => cancelField("statement")}
                labels={markdownLabels(tDetail("markdown.emptyStatement"))}
                actions={
                  <AiRewritePanel
                    field="statement"
                    value={note.statement}
                    context={{ title: note.title }}
                    quickActions={[
                      {
                        operation: "format_markdown",
                        label: tDetail("ai.formatStatement"),
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
                isEditDisabled={activePitfall !== null}
                onEdit={() => beginField("approach")}
                onChange={(value) => update("approach", value)}
                onComplete={() => setActiveField(null)}
                onCancel={() => cancelField("approach")}
                labels={markdownLabels(tDetail("markdown.emptyApproach"))}
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
                        label: tDetail("ai.organizeApproach"),
                      },
                    ]}
                    externalActions={[
                      {
                        id: "generate",
                        label: tDetail("generateApproach"),
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
                </div>
                <PitfallBlocks
                  value={note.pitfalls}
                  onChange={(value) => update("pitfalls", value)}
                  activeIndex={activePitfall}
                  onBeginEdit={beginPitfall}
                  onCompleteEdit={() => setActivePitfall(null)}
                  onCancelEdit={() => {
                    update("pitfalls", pitfallSnapshot);
                    setActivePitfall(null);
                  }}
                  labels={pitfallLabels}
                  actions={(index, draftValue, setDraftValue) => (
                    <AiRewritePanel
                      key={index}
                      field="pitfall"
                      value={draftValue}
                      context={{
                        title: note.title,
                        statement: note.statement,
                        approach: note.approach,
                      }}
                      quickActions={[
                        {
                          operation: "clarify",
                          label: tDetail("ai.clarifyPitfall"),
                        },
                        {
                          operation: "shorten",
                          label: tDetail("ai.shortenPitfall"),
                        },
                      ]}
                      onApply={setDraftValue}
                      labels={aiLabels}
                    />
                  )}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" isPending={saving}>
                {t("submit")}
              </Button>
            </Form>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
