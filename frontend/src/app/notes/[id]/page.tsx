"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { ImportancePicker } from "@/components/ImportancePicker";
import { NoteTags } from "@/components/NoteTags";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { authClient } from "@/lib/auth-client";
import { clampImportance, type ImportanceLevel } from "@/lib/importance";
import type { NoteDraft, PracticeNote } from "@/lib/types";

const fields: Array<{ key: "statement" | "approach" | "code"; label: string; rows: number }> = [
  { key: "statement", label: "Problem statement", rows: 5 },
  { key: "approach", label: "Approach", rows: 5 },
  { key: "code", label: "Code", rows: 10 },
];

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [note, setNote] = useState<PracticeNote | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const response = await fetch(`/api/bff/notes/${id}`);
      const data = (await response.json()) as PracticeNote | { error?: string };
      if (!response.ok) setError((data as { error?: string }).error ?? "Could not load note");
      else setNote(data as PracticeNote);
    })();
  }, [id, session]);

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
    if (!response.ok) return setError(data.error ?? "Could not rewrite this field");
    update(field, data.rewritten ?? note[field]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!response.ok) return setError((data as { error?: string }).error ?? "Could not save note");
    setNote(data as PracticeNote);
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl p-5">
        <p className="text-sm font-semibold text-teal-700">Practice archive</p>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold">{note?.title ?? "Edit note"}</h1>
          {note && (
            <div className="flex flex-wrap items-center gap-2">
              <ImportanceBadge value={note.importance} showLabel />
              <NoteTags tags={note.tags} emptyLabel="" />
            </div>
          )}
        </div>
        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
        {!note ? (
          <p className="text-slate-600">Loading note…</p>
        ) : (
          <Card className="border border-slate-200 bg-white">
            <Card.Content>
              <Form className="flex flex-col gap-5" onSubmit={submit}>
                <TextField isRequired name="title" value={note.title} onChange={(value) => update("title", value)}>
                  <Label>Title</Label>
                  <Input />
                </TextField>
                {fields.map(({ key, label, rows }) => (
                  <div key={key} className="space-y-2">
                    <TextField name={key} value={note[key]} onChange={(value) => update(key, value)}>
                      <Label>{label}</Label>
                      <TextArea rows={rows} className={key === "code" ? "font-mono text-sm" : ""} />
                    </TextField>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isPending={rewriting === key}
                      onPress={() => rewrite(key)}
                    >
                      Rewrite with AI
                    </Button>
                  </div>
                ))}
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="tags"
                    value={note.tags.join(", ")}
                    onChange={(value) =>
                      update(
                        "tags",
                        value.split(",").map((tag) => tag.trim()).filter(Boolean),
                      )
                    }
                  >
                    <Label>Tags</Label>
                    <Input />
                  </TextField>
                  <TextField
                    name="pitfalls"
                    value={note.pitfalls.join("\n")}
                    onChange={(value) =>
                      update(
                        "pitfalls",
                        value.split("\n").map((item) => item.trim()).filter(Boolean),
                      )
                    }
                  >
                    <Label>Pitfalls</Label>
                    <TextArea rows={3} />
                  </TextField>
                </div>
                <ImportancePicker
                  value={note.importance}
                  onChange={(value: ImportanceLevel) => update("importance", value)}
                />
                <p className="text-sm text-slate-500">AI rewrites only update the editor. Save when you are ready.</p>
                <Button type="submit" isPending={saving}>Save changes</Button>
              </Form>
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}
