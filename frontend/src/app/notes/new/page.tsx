"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { ImportancePicker } from "@/components/ImportancePicker";
import { authClient } from "@/lib/auth-client";
import { clampImportance, type ImportanceLevel } from "@/lib/importance";
import { emptyNote, type NoteDraft } from "@/lib/types";

export default function NewNotePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
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
    if (!response.ok) return setError(data.error ?? "Could not create note");
    router.replace(`/notes/${data.id}`);
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl p-5">
        <p className="text-sm font-semibold text-teal-700">Practice archive</p>
        <h1 className="mb-6 text-3xl font-semibold">New note</h1>
        <Card className="border border-slate-200 bg-white">
          <Card.Content>
            <Form className="flex flex-col gap-5" onSubmit={submit}>
              <TextField isRequired name="title" value={note.title} onChange={(value) => update("title", value)}>
                <Label>Title</Label>
                <Input placeholder="Two Sum" />
              </TextField>
              <TextField name="statement" value={note.statement} onChange={(value) => update("statement", value)}>
                <Label>Problem statement</Label>
                <TextArea rows={5} />
              </TextField>
              <TextField name="approach" value={note.approach} onChange={(value) => update("approach", value)}>
                <Label>Approach</Label>
                <TextArea rows={5} />
              </TextField>
              <TextField name="code" value={note.code} onChange={(value) => update("code", value)}>
                <Label>Code</Label>
                <TextArea rows={10} className="font-mono text-sm" />
              </TextField>
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
                  <Input placeholder="array, hash map" />
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
                  <TextArea rows={3} placeholder="One per line" />
                </TextField>
              </div>
              <ImportancePicker
                value={note.importance}
                onChange={(value: ImportanceLevel) => update("importance", value)}
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" isPending={saving}>Save note</Button>
            </Form>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
