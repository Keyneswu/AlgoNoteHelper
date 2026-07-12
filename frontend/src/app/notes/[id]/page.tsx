"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { ImportancePicker } from "@/components/ImportancePicker";
import { NoteTags } from "@/components/NoteTags";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampImportance, type ImportanceLevel } from "@/lib/importance";
import type { NoteDraft, PracticeNote } from "@/lib/types";

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("notes.detail");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<PracticeNote | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

  const textFields: Array<{
    key: "statement" | "approach";
    label: string;
    kind: "statement" | "approach";
    rows: number;
  }> = [
    { key: "statement", label: tCommon("fields.problemStatement"), kind: "statement", rows: 5 },
    { key: "approach", label: tCommon("fields.approach"), kind: "approach", rows: 5 },
  ];

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const response = await fetch(`/api/bff/notes/${id}`);
      const data = (await response.json()) as PracticeNote | { error?: string };
      if (!response.ok) setError((data as { error?: string }).error ?? t("errors.couldNotLoad"));
      else setNote(data as PracticeNote);
    })();
  }, [id, session, t]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => (current ? { ...current, [field]: value } : current));
  }

  async function rewrite(field: "statement" | "approach" | "code") {
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

  async function saveNote(andReturn: boolean) {
    if (!note) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/bff/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...note, importance: clampImportance(note.importance) }),
    });
    const data = (await response.json()) as PracticeNote | { error?: string };
    setSaving(false);
    if (!response.ok) return setError((data as { error?: string }).error ?? t("errors.couldNotSave"));
    setNote(data as PracticeNote);
    if (andReturn) router.push("/notes");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveNote(false);
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
              <ImportanceBadge value={note.importance} showLabel />
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
                  <Input />
                </TextField>
                {textFields.map(({ key, label, kind, rows }) => (
                  <div key={key} className="space-y-2">
                    <TextField name={key} value={note[key]} onChange={(value) => update(key, value)}>
                      <FieldLabel kind={kind}>{label}</FieldLabel>
                      <TextArea rows={rows} />
                    </TextField>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isPending={rewriting === key}
                      onPress={() => rewrite(key)}
                    >
                      {t("rewriteWithAi")}
                    </Button>
                  </div>
                ))}
                <div className="space-y-2">
                  <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                  <CodeField
                    value={note.code}
                    onChange={(value) => update("code", value)}
                    language={codeLanguage}
                    rows={10}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isPending={rewriting === "code"}
                    onPress={() => rewrite("code")}
                  >
                    {t("rewriteWithAi")}
                  </Button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TagPicker value={note.tags} onChange={(tags) => update("tags", tags)} />
                  <TextField
                    name="pitfalls"
                    value={note.pitfalls.join("\n")}
                    onChange={(value) =>
                      update(
                        "pitfalls",
                        value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  >
                    <FieldLabel kind="pitfalls">{tCommon("fields.pitfalls")}</FieldLabel>
                    <TextArea rows={3} />
                  </TextField>
                </div>
                <div className="space-y-2">
                  <FieldLabel kind="importance">{tCommon("fields.importance")}</FieldLabel>
                  <ImportancePicker
                    value={note.importance}
                    onChange={(value: ImportanceLevel) => update("importance", value)}
                    showLegend={false}
                  />
                </div>
                <p className="text-sm text-muted">{t("aiRewriteHint")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" isPending={saving}>
                    {t("save")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    isPending={saving}
                    onPress={() => void saveNote(true)}
                  >
                    {t("saveAndReturn")}
                  </Button>
                </div>
              </Form>
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}
