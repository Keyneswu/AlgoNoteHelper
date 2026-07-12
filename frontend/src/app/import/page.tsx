"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion, Button, Card, Input, Label, TextArea, TextField, type Key } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { ImportancePicker } from "@/components/ImportancePicker";
import { NoteTags } from "@/components/NoteTags";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampImportance, getImportanceMeta, type ImportanceLevel } from "@/lib/importance";
import type { NoteDraft, PracticeNote } from "@/lib/types";

type ImportCandidate = NoteDraft & { key: string };

export default function ImportPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);
  const [markdown, setMarkdown] = useState("");
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function extract() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/bff/notes/import/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown }),
    });
    const data = (await response.json()) as { candidates?: NoteDraft[]; error?: string };
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Could not extract notes");
    // Fresh extract: all rows start collapsed.
    setExpandedKeys(new Set());
    setCandidates(
      (data.candidates ?? []).map((candidate) => ({
        ...candidate,
        key: crypto.randomUUID(),
        importance: clampImportance(candidate.importance),
      })),
    );
  }

  function update(key: string, field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) {
    setCandidates((items) =>
      items.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  }

  function removeCandidate(key: string) {
    setCandidates((items) => items.filter((item) => item.key !== key));
    setExpandedKeys((keys) => {
      const next = new Set(keys);
      next.delete(key);
      return next;
    });
  }

  async function commit() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/bff/notes/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidates: candidates.map(({ key: _key, ...candidate }) => ({
          ...candidate,
          importance: clampImportance(candidate.importance),
        })),
      }),
    });
    const data = (await response.json()) as PracticeNote[] | { error?: string };
    setLoading(false);
    if (!response.ok) return setError((data as { error?: string }).error ?? "Could not import notes");
    router.push("/notes");
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl space-y-6 p-5">
        <div>
          <p className="text-sm font-semibold text-teal-700">Bring your archive together</p>
          <h1 className="text-3xl font-semibold">Import Markdown</h1>
        </div>
        <Card className="border border-slate-200 bg-white">
          <Card.Content className="space-y-4">
            <TextField name="markdown" value={markdown} onChange={setMarkdown}>
              <Label>Markdown source</Label>
              <TextArea rows={12} placeholder="# Two Sum&#10;..." />
            </TextField>
            <Button onPress={extract} isDisabled={!markdown.trim()} isPending={loading}>
              Extract notes
            </Button>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!!candidates.length && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Review extracted notes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Collapsed by default — expand a problem to edit its fields.
                </p>
              </div>
              <Button onPress={commit} isPending={loading}>
                Import {candidates.length} notes
              </Button>
            </div>
            <Accordion
              allowsMultipleExpanded
              className="flex flex-col gap-3"
              expandedKeys={expandedKeys}
              onExpandedChange={setExpandedKeys}
            >
              {candidates.map((candidate, index) => {
                const meta = getImportanceMeta(candidate.importance);
                return (
                  <Accordion.Item
                    key={candidate.key}
                    id={candidate.key}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <Accordion.Heading>
                      <div className="flex items-stretch">
                        <div className={`w-1 shrink-0 ${meta.accentClass}`} aria-hidden />
                        <Accordion.Trigger className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                          <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">
                            <span className="mr-2 text-xs font-medium text-slate-400">{index + 1}.</span>
                            {candidate.title || "Untitled"}
                          </span>
                          <ImportanceBadge value={candidate.importance} showLabel className="shrink-0" />
                          <Accordion.Indicator className="shrink-0 text-slate-400" />
                        </Accordion.Trigger>
                        <div className="flex items-center border-l border-slate-100 px-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="tertiary"
                            onPress={() => removeCandidate(candidate.key)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body className="space-y-3 border-t border-slate-100 px-4 py-4">
                        <TextField
                          name={`title-${candidate.key}`}
                          value={candidate.title}
                          onChange={(value) => update(candidate.key, "title", value)}
                        >
                          <Label>Title</Label>
                          <Input />
                        </TextField>
                        <TextField
                          name={`statement-${candidate.key}`}
                          value={candidate.statement}
                          onChange={(value) => update(candidate.key, "statement", value)}
                        >
                          <Label>Statement</Label>
                          <TextArea rows={3} />
                        </TextField>
                        <TextField
                          name={`approach-${candidate.key}`}
                          value={candidate.approach}
                          onChange={(value) => update(candidate.key, "approach", value)}
                        >
                          <Label>Approach</Label>
                          <TextArea rows={3} />
                        </TextField>
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <CodeField
                            value={candidate.code}
                            onChange={(value) => update(candidate.key, "code", value)}
                            language={codeLanguage}
                            rows={4}
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TextField
                            name={`tags-${candidate.key}`}
                            value={candidate.tags.join(", ")}
                            onChange={(value) =>
                              update(
                                candidate.key,
                                "tags",
                                value.split(",").map((tag) => tag.trim()).filter(Boolean),
                              )
                            }
                          >
                            <Label>Tags</Label>
                            <Input />
                          </TextField>
                          <TextField
                            name={`pitfalls-${candidate.key}`}
                            value={candidate.pitfalls.join("\n")}
                            onChange={(value) =>
                              update(
                                candidate.key,
                                "pitfalls",
                                value.split("\n").map((item) => item.trim()).filter(Boolean),
                              )
                            }
                          >
                            <Label>Pitfalls</Label>
                            <TextArea rows={2} />
                          </TextField>
                        </div>
                        {!!candidate.tags.length && (
                          <NoteTags tags={candidate.tags} />
                        )}
                        <ImportancePicker
                          name={`importance-${candidate.key}`}
                          value={candidate.importance}
                          onChange={(value: ImportanceLevel) => update(candidate.key, "importance", value)}
                        />
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          </section>
        )}
      </main>
    </div>
  );
}
