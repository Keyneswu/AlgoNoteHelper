"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Accordion, Button, Card, Input, Label, TextArea, TextField, type Key } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { PendingLabel } from "@/components/icons";
import { NoteTags } from "@/components/NoteTags";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { bffFetch } from "@/lib/bff";
import {
  clearImportUiState,
  loadImportUiState,
  saveImportUiState,
  type ImportCandidate,
} from "@/lib/import-store";
import { clampDifficulty, getDifficultyMeta, type DifficultyLevel } from "@/lib/difficulty";
import { fetchSimilarNotes } from "@/lib/notes-api";
import { normalizePitfalls, pitfallsFromText } from "@/lib/pitfalls";
import { noteToDraft, saveResolveSession } from "@/lib/resolve-store";
import type { NoteDraft, PracticeNote } from "@/lib/types";

export default function ImportPage() {
  const t = useTranslations("import");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { session, isPending } = useRequireSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);

  const initial = loadImportUiState();
  const [markdown, setMarkdown] = useState(initial.markdown);
  const [candidates, setCandidates] = useState<ImportCandidate[]>(initial.candidates);
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
    () => new Set(initial.expandedKeys),
  );
  const [error, setError] = useState(initial.error);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveImportUiState({
      markdown,
      candidates,
      expandedKeys: [...expandedKeys].map(String),
      error,
    });
  }, [markdown, candidates, expandedKeys, error]);

  async function extract() {
    setLoading(true);
    setError("");
    try {
      const data = await bffFetch<{ candidates?: NoteDraft[] }>("/api/bff/notes/import/extract", {
        method: "POST",
        body: JSON.stringify({ markdown }),
      });
      setExpandedKeys(new Set());
      const withKeys: ImportCandidate[] = (data.candidates ?? []).map((candidate) => ({
        ...candidate,
        key: crypto.randomUUID(),
        difficulty: clampDifficulty(candidate.difficulty),
        matches: [],
      }));
      const withMatches = await Promise.all(
        withKeys.map(async (candidate) => ({
          ...candidate,
          matches: candidate.title.trim()
            ? await fetchSimilarNotes(candidate)
            : [],
        })),
      );
      setCandidates(withMatches);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.couldNotExtract"));
    } finally {
      setLoading(false);
    }
  }

  function openResolve(candidate: ImportCandidate) {
    if (!candidate.matches?.length) return;
    saveResolveSession({
      origin: "import",
      candidateKey: candidate.key,
      incoming: noteToDraft(candidate),
      matches: candidate.matches,
    });
    router.push("/import/resolve");
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
    const pending = candidates.filter((candidate) => candidate.mergedNoteId == null);
    if (!pending.length) {
      setLoading(false);
      clearImportUiState();
      setMarkdown("");
      setCandidates([]);
      setExpandedKeys(new Set());
      router.push("/notes");
      return;
    }
    try {
      await bffFetch<PracticeNote[]>("/api/bff/notes/import/commit", {
        method: "POST",
        body: JSON.stringify({
          candidates: pending.map((candidate) => {
            const draft = noteToDraft(candidate);
            return {
              ...draft,
              difficulty: clampDifficulty(draft.difficulty),
              pitfalls: normalizePitfalls(draft.pitfalls),
            };
          }),
        }),
      });
      clearImportUiState();
      setMarkdown("");
      setCandidates([]);
      setExpandedKeys(new Set());
      setError("");
      router.push("/notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.couldNotImport"));
    } finally {
      setLoading(false);
    }
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div>
          <p className="text-sm font-semibold text-accent">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("heading")}</h1>
        </div>
        <Card className="border border-border bg-surface">
          <Card.Content className="space-y-4">
            <TextField name="markdown" value={markdown} onChange={setMarkdown}>
              <Label>{t("markdownSource")}</Label>
              <TextArea rows={12} placeholder={t("markdownPlaceholder")} />
            </TextField>
            <Button onPress={extract} isDisabled={!markdown.trim()} isPending={loading}>
              {({ isPending }) => (
                <PendingLabel pending={isPending}>{t("extractNotes")}</PendingLabel>
              )}
            </Button>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!!candidates.length && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{t("reviewHeading")}</h2>
                <p className="mt-1 text-sm text-muted">{t("reviewHint")}</p>
              </div>
              <Button onPress={commit} isPending={loading}>
                {({ isPending }) => (
                  <PendingLabel pending={isPending}>
                    {t("importCount", {
                      count: candidates.filter((c) => c.mergedNoteId == null).length,
                    })}
                  </PendingLabel>
                )}
              </Button>
            </div>
            <Accordion
              allowsMultipleExpanded
              className="flex flex-col gap-3"
              expandedKeys={expandedKeys}
              onExpandedChange={setExpandedKeys}
            >
              {candidates.map((candidate, index) => {
                const meta = getDifficultyMeta(candidate.difficulty);
                const title = candidate.title || t("untitled");
                return (
                  <Accordion.Item
                    key={candidate.key}
                    id={candidate.key}
                    className="overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <Accordion.Heading className="w-full">
                      <div className="flex w-full min-w-0 items-stretch">
                        <div className={`w-1 shrink-0 self-stretch ${meta.accentClass}`} aria-hidden />
                        <Accordion.Trigger className="import-candidate-trigger !flex min-h-12 min-w-0 flex-1 !justify-start items-center gap-3 overflow-hidden px-3 py-3 text-left hover:bg-raised/50 sm:gap-4 sm:px-4">
                          <span className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-muted sm:w-6">
                            {index + 1}
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-base"
                            title={title}
                          >
                            {title}
                          </span>
                          <span className="hidden w-[4.75rem] shrink-0 justify-end sm:flex">
                            <DifficultyBadge
                              value={candidate.difficulty}
                              showLabel
                              size="sm"
                              className="whitespace-nowrap"
                            />
                          </span>
                          <Accordion.Indicator className="size-4 shrink-0 text-muted" />
                        </Accordion.Trigger>
                        <div className="flex shrink-0 items-center gap-1.5 pr-2 pl-1 sm:pr-3">
                          <div className="flex w-[4.5rem] shrink-0 justify-end">
                            {!!candidate.matches?.length && !candidate.mergedNoteId ? (
                              <button
                                type="button"
                                onClick={() => openResolve(candidate)}
                                className="w-full rounded-md border border-amber-500/70 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition hover:border-amber-400 hover:bg-amber-500/10 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                                title={t("possibleConflictHint")}
                              >
                                {t("possibleConflict")}
                              </button>
                            ) : candidate.mergedNoteId != null ? (
                              <span className="flex w-full items-center justify-center px-1 text-xs font-medium text-emerald-400">
                                {t("mergedBadge")}
                              </span>
                            ) : (
                              <span
                                className="invisible w-full rounded-md border px-2.5 py-1.5 text-xs font-semibold"
                                aria-hidden
                              >
                                {t("possibleConflict")}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCandidate(candidate.key)}
                            className="w-[4.5rem] shrink-0 rounded-md border border-red-500/70 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                          >
                            {tCommon("actions.remove")}
                          </button>
                        </div>
                      </div>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body className="space-y-3 border-t border-border px-4 py-4">
                        <TextField
                          name={`title-${candidate.key}`}
                          value={candidate.title}
                          onChange={(value) => update(candidate.key, "title", value)}
                        >
                          <FieldLabel kind="title">{tCommon("fields.title")}</FieldLabel>
                          <Input className="!text-xl font-semibold leading-snug" />
                        </TextField>
                        <TextField
                          name={`statement-${candidate.key}`}
                          value={candidate.statement}
                          onChange={(value) => update(candidate.key, "statement", value)}
                        >
                          <FieldLabel kind="statement">{tCommon("fields.problemStatement")}</FieldLabel>
                          <TextArea rows={3} className="!text-base leading-relaxed" />
                        </TextField>
                        <TextField
                          name={`approach-${candidate.key}`}
                          value={candidate.approach}
                          onChange={(value) => update(candidate.key, "approach", value)}
                        >
                          <FieldLabel kind="approach">{tCommon("fields.approach")}</FieldLabel>
                          <TextArea rows={3} className="!text-base leading-relaxed" />
                        </TextField>
                        <div className="space-y-2">
                          <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                          <CodeField
                            value={candidate.code}
                            onChange={(value) => update(candidate.key, "code", value)}
                            language={codeLanguage}
                            minRows={4}
                            maxRows={12}
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TagPicker
                            name={`tags-${candidate.key}`}
                            value={candidate.tags}
                            onChange={(tags) => update(candidate.key, "tags", tags)}
                          />
                          <TextField
                            name={`pitfalls-${candidate.key}`}
                            value={candidate.pitfalls.join("\n")}
                            onChange={(value) =>
                              update(candidate.key, "pitfalls", pitfallsFromText(value))
                            }
                          >
                            <FieldLabel kind="pitfalls">{tCommon("fields.pitfalls")}</FieldLabel>
                            <TextArea rows={2} className="!text-base leading-relaxed" />
                          </TextField>
                        </div>
                        {!!candidate.tags.length && <NoteTags tags={candidate.tags} />}
                        <div className="space-y-2">
                          <FieldLabel kind="difficulty">{tCommon("fields.difficulty")}</FieldLabel>
                          <DifficultyPicker
                            name={`difficulty-${candidate.key}`}
                            value={candidate.difficulty}
                            onChange={(value: DifficultyLevel) =>
                              update(candidate.key, "difficulty", value)
                            }
                            showLegend={false}
                          />
                        </div>
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
