"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { ImportanceIcon } from "@/components/ImportanceBadge";
import { NoteCard } from "@/components/NoteCard";
import { authClient } from "@/lib/auth-client";
import { IMPORTANCE_LEVELS, type ImportanceLevel } from "@/lib/importance";
import type { PracticeNote } from "@/lib/types";

export default function NotesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [notes, setNotes] = useState<PracticeNote[]>([]);
  const [tags, setTags] = useState("");
  const [importanceMin, setImportanceMin] = useState<ImportanceLevel | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function loadNotes() {
    setLoading(true);
    setError("");
    const query = new URLSearchParams();
    tags.split(",").map((tag) => tag.trim()).filter(Boolean).forEach((tag) => query.append("tags", tag));
    if (importanceMin) query.set("importance_min", String(importanceMin));
    if (from) query.set("updated_from", from);
    if (to) query.set("updated_to", `${to}T23:59:59`);
    const response = await fetch(`/api/bff/notes?${query.toString()}`);
    const data = (await response.json()) as PracticeNote[] | { error?: string };
    setLoading(false);
    if (!response.ok) return setError((data as { error?: string }).error ?? "Could not load notes");
    setNotes(data as PracticeNote[]);
  }

  useEffect(() => {
    if (session) void loadNotes();
  // Fetch only after authentication; filtering is explicitly user-triggered.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">Practice archive</p>
            <h1 className="text-3xl font-semibold">Notes</h1>
          </div>
          <Link href="/notes/new" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
            New note
          </Link>
        </div>
        <Card className="border border-slate-200 bg-white">
          <Card.Content className="grid gap-4 md:grid-cols-4">
            <TextField name="tags" value={tags} onChange={setTags}>
              <Label>Tags</Label>
              <Input placeholder="array, dp" />
            </TextField>
            <fieldset className="space-y-2 md:col-span-1">
              <legend className="text-sm font-medium text-slate-700">Min importance</legend>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setImportanceMin("")}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                    importanceMin === ""
                      ? "bg-slate-800 text-white ring-slate-800"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Any
                </button>
                {IMPORTANCE_LEVELS.map((level) => {
                  const selected = importanceMin === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      title={`${level.label} or higher`}
                      aria-pressed={selected}
                      onClick={() => setImportanceMin(level.value)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                        selected ? `${level.badgeClass} ring-2` : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ImportanceIcon value={level.value} className={`size-3.5 ${selected ? level.iconClass : "text-slate-400"}`} />
                      {level.label}+
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <TextField name="from" type="date" value={from} onChange={setFrom}>
              <Label>Updated after</Label>
              <Input />
            </TextField>
            <TextField name="to" type="date" value={to} onChange={setTo}>
              <Label>Updated before</Label>
              <Input />
            </TextField>
            <div className="md:col-span-4">
              <Button onPress={loadNotes} isPending={loading}>Apply filters</Button>
            </div>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
          ))}
          {!loading && !notes.length && (
            <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
              No notes match these filters. Create one to start your archive.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
