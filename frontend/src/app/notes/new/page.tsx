"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { ImportancePicker } from "@/components/ImportancePicker";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampImportance, type ImportanceLevel } from "@/lib/importance";
import { emptyNote, type NoteDraft } from "@/lib/types";

export default function NewNotePage() {
  const t = useTranslations("notes.new");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [note, setNote] = useState<NoteDraft>(emptyNote);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  function update(field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setNote((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/bff/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...note, importance: clampImportance(note.importance) }),
    });
    const data = (await response.json()) as { id?: number; error?: string };
    setSaving(false);
    if (!response.ok) return setError(data.error ?? t("errors.couldNotCreate"));
    router.replace(`/notes/${data.id}`);
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
                <Input placeholder={tCommon("placeholders.titleExample")} />
              </TextField>
              <TextField name="statement" value={note.statement} onChange={(value) => update("statement", value)}>
                <FieldLabel kind="statement">{tCommon("fields.problemStatement")}</FieldLabel>
                <TextArea rows={5} />
              </TextField>
              <TextField name="approach" value={note.approach} onChange={(value) => update("approach", value)}>
                <FieldLabel kind="approach">{tCommon("fields.approach")}</FieldLabel>
                <TextArea rows={5} />
              </TextField>
              <div className="space-y-2">
                <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                <CodeField
                  value={note.code}
                  onChange={(value) => update("code", value)}
                  language={codeLanguage}
                  rows={10}
                />
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
                  <TextArea rows={3} placeholder={tCommon("placeholders.pitfallsOnePerLine")} />
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
