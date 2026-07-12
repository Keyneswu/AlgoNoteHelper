"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { ImportanceMultiSelect } from "@/components/ImportanceMultiSelect";
import { NoteCard } from "@/components/NoteCard";
import { TagPicker } from "@/components/TagPicker";
import { authClient } from "@/lib/auth-client";
import { ALL_IMPORTANCE_LEVELS, type ImportanceLevel } from "@/lib/importance";
import type { PracticeNote } from "@/lib/types";

type CommittedQuery = {
  title: string;
  tags: string[];
};

function buildNotesQuery(committed: CommittedQuery, importance: ImportanceLevel[]) {
  const query = new URLSearchParams();
  const title = committed.title.trim();
  if (title) query.set("q", title);
  committed.tags.forEach((tag) => query.append("tags", tag));
  importance.forEach((level) => query.append("importance", String(level)));
  return query;
}

export default function NotesPage() {
  const t = useTranslations("notes.list");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [notes, setNotes] = useState<PracticeNote[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [committed, setCommitted] = useState<CommittedQuery>({ title: "", tags: [] });
  const [importance, setImportance] = useState<ImportanceLevel[]>([...ALL_IMPORTANCE_LEVELS]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function loadNotes(nextCommitted: CommittedQuery, nextImportance: ImportanceLevel[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");
    const query = buildNotesQuery(nextCommitted, nextImportance);
    try {
      const response = await fetch(`/api/bff/notes?${query.toString()}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as PracticeNote[] | { error?: string };
      if (requestId !== requestIdRef.current) return;
      if (!response.ok) {
        setError((data as { error?: string }).error ?? t("errors.couldNotLoad"));
        return;
      }
      setNotes(data as PracticeNote[]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setError(t("errors.couldNotLoad"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadNotes(committed, importance);
    // Initial + importance live updates; title/tags only via commitSearch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, importance]);

  function commitSearch() {
    const next = {
      title: draftTitle.trim(),
      tags: draftTags,
    };
    setCommitted(next);
    void loadNotes(next, importance);
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accent">{tCommon("practiceArchive")}</p>
            <h1 className="text-3xl font-semibold text-foreground">{t("heading")}</h1>
          </div>
          <Link
            href="/notes/new"
            className="rounded-md bg-accent-emphasis px-3 py-2 text-sm font-medium text-white hover:bg-accent"
          >
            {t("newNote")}
          </Link>
        </div>
        <Card className="border border-border bg-surface">
          <Card.Content>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                commitSearch();
              }}
            >
              <TextField name="title" value={draftTitle} onChange={setDraftTitle}>
                <Label>{t("filters.title")}</Label>
                <Input placeholder={t("filters.titlePlaceholder")} />
              </TextField>
              <TagPicker
                variant="filter"
                value={draftTags}
                onChange={setDraftTags}
                label={t("filters.tags")}
              />
              <ImportanceMultiSelect
                value={importance}
                onChange={setImportance}
                legend={t("filters.importance")}
              />
              <div className="flex items-end">
                <Button type="submit" isPending={loading}>
                  {t("filters.search")}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
          ))}
          {!loading && !notes.length && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              {t("empty")}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
