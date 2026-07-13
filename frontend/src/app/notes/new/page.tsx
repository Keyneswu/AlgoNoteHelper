"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampDifficulty, type DifficultyLevel } from "@/lib/difficulty";
import { normalizePitfalls, pitfallsFromText } from "@/lib/pitfalls";
import { noteToDraft, saveResolveSession } from "@/lib/resolve-store";
import { emptyNote, type NoteDraft, type PracticeNote } from "@/lib/types";

type AiField = "statement" | "approach" | "code";

export default function NewNotePage() {
  const t = useTranslations("notes.new");
  const tDetail = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<NoteDraft>(emptyNote);
  const [baseline, setBaseline] = useState<Pick<NoteDraft, AiField>>({
    statement: emptyNote.statement,
    approach: emptyNote.approach,
    code: emptyNote.code,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => ({ ...current, [field]: value }));
  }

  function reverseField(field: AiField) {
    update(field, baseline[field]);
  }

  function statementReadiness(statement: string): "ok" | "empty" | "incomplete" {
    const text = statement.trim();
    if (!text) return "empty";
    if (text.length < 40) return "incomplete";
    return "ok";
  }

  async function rewrite(field: "statement" | "code") {
    setBaseline((current) => ({ ...current, [field]: note[field] }));
    setRewriting(field);
    setError("");
    const response = await fetch("/api/bff/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, text: note[field] }),
    });
    const data = (await response.json()) as { rewritten?: string; error?: string };
    setRewriting(null);
    if (!response.ok) return setError(data.error ?? tDetail("errors.couldNotRewrite"));
    update(field, data.rewritten ?? note[field]);
  }

  async function generateApproach() {
    const readiness = statementReadiness(note.statement);
    if (readiness === "empty") {
      setError(tDetail("errors.statementRequiredForApproach"));
      return;
    }
    if (readiness === "incomplete") {
      setError(tDetail("errors.statementIncompleteForApproach"));
      return;
    }
    setBaseline((current) => ({ ...current, approach: note.approach }));
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
    if (!response.ok) return setError(data.error ?? tDetail("errors.couldNotGenerateApproach"));
    update("approach", data.rewritten ?? note.approach);
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
                    onPress={() => void rewrite("statement")}
                  >
                    {tDetail("rewriteWithAi")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    isDisabled={note.statement === baseline.statement}
                    onPress={() => reverseField("statement")}
                  >
                    {tDetail("reverse")}
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
                    {tDetail("generateApproach")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    isDisabled={note.approach === baseline.approach}
                    onPress={() => reverseField("approach")}
                  >
                    {tDetail("reverse")}
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
                    onPress={() => void rewrite("code")}
                  >
                    {tDetail("rewriteWithAi")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    isDisabled={note.code === baseline.code}
                    onPress={() => reverseField("code")}
                  >
                    {tDetail("reverse")}
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
                </div>
                <TextField
                  name="pitfalls"
                  value={note.pitfalls.join("\n")}
                  onChange={(value) => update("pitfalls", pitfallsFromText(value))}
                >
                  <FieldLabel kind="pitfalls">{tCommon("fields.pitfalls")}</FieldLabel>
                  <TextArea
                    rows={8}
                    className="min-h-[12rem] !text-base leading-relaxed"
                    placeholder={tCommon("placeholders.pitfallsOnePerLine")}
                  />
                </TextField>
              </div>
              <p className="text-sm text-muted">{tDetail("aiAssistHint")}</p>
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
