"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Input, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { TagPicker } from "@/components/TagPicker";
import { usePreferredCodeLanguage } from "@/hooks/usePreferredCodeLanguage";
import { authClient } from "@/lib/auth-client";
import { clampDifficulty, type DifficultyLevel } from "@/lib/difficulty";
import { loadImportUiState, saveImportUiState } from "@/lib/import-store";
import { normalizePitfalls, pitfallsFromText } from "@/lib/pitfalls";
import {
  buildMergeCanvas,
  clearResolveSession,
  loadResolveSession,
  noteToDraft,
  type ResolveSession,
  type SimilarMatch,
} from "@/lib/resolve-store";
import type { NoteDraft, PracticeNote } from "@/lib/types";

type TextFieldKey = "title" | "statement" | "approach" | "code";

function snapshotExisting(match: SimilarMatch): NoteDraft {
  return noteToDraft(match.note);
}

export function ResolveConflictPage() {
  const t = useTranslations("resolve");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const codeLanguage = usePreferredCodeLanguage(!!session);

  const [payload, setPayload] = useState<ResolveSession | null>(null);
  const [incomingBaseline, setIncomingBaseline] = useState<NoteDraft | null>(null);
  const [incoming, setIncoming] = useState<NoteDraft | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<NoteDraft | null>(null);
  const [canvas, setCanvas] = useState<NoteDraft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mergingField, setMergingField] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  useEffect(() => {
    const stored = loadResolveSession();
    if (!stored || !stored.matches.length) {
      setPayload(null);
      return;
    }
    setPayload(stored);
    const incomingDraft = noteToDraft(stored.incoming);
    setIncomingBaseline(incomingDraft);
    setIncoming(incomingDraft);
    const first = stored.matches[0];
    setSelectedId(first.note.id);
    const base = snapshotExisting(first);
    setBaseline(base);
    setCanvas(buildMergeCanvas(base, incomingDraft));
  }, []);

  const selectedMatch = useMemo(
    () => payload?.matches.find((m) => m.note.id === selectedId) ?? null,
    [payload, selectedId],
  );

  function selectMatch(match: SimilarMatch) {
    if (!incoming) return;
    setSelectedId(match.note.id);
    const base = snapshotExisting(match);
    setBaseline(base);
    setCanvas(buildMergeCanvas(base, incoming));
    setError("");
  }

  function updateCanvas<K extends keyof NoteDraft>(field: K, value: NoteDraft[K]) {
    setCanvas((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateIncoming<K extends keyof NoteDraft>(field: K, value: NoteDraft[K]) {
    setIncoming((current) => (current ? { ...current, [field]: value } : current));
  }

  function reverseExistingField(field: TextFieldKey | "pitfalls" | "tags" | "difficulty") {
    if (!baseline) return;
    updateCanvas(field, baseline[field] as never);
  }

  function reverseIncomingField(field: TextFieldKey | "pitfalls" | "tags" | "difficulty") {
    if (!incomingBaseline) return;
    updateIncoming(field, incomingBaseline[field] as never);
  }

  async function aiMergeField(field: TextFieldKey | "pitfalls") {
    if (!incoming || !baseline || !canvas) return;
    const existingText =
      field === "pitfalls" ? baseline.pitfalls.join("\n") : String(baseline[field] ?? "");
    const incomingText =
      field === "pitfalls" ? incoming.pitfalls.join("\n") : String(incoming[field] ?? "");
    if (!existingText.trim() || !incomingText.trim()) return;

    setMergingField(field);
    setError("");
    const response = await fetch("/api/bff/notes/ai-merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field,
        existing: existingText,
        incoming: incomingText,
      }),
    });
    const data = (await response.json()) as { merged?: string; error?: string };
    setMergingField(null);
    if (!response.ok) {
      setError(data.error ?? t("errors.couldNotAiMerge"));
      return;
    }
    const merged = data.merged ?? "";
    if (field === "pitfalls") {
      updateCanvas("pitfalls", normalizePitfalls(merged.split("\n")));
    } else {
      updateCanvas(field, merged);
    }
  }

  function returnToOrigin(options?: { mergedNoteId?: number; createdNoteId?: number }) {
    if (!payload) return;
    if (payload.origin === "import" && payload.candidateKey) {
      const state = loadImportUiState();
      const nextCandidates = state.candidates
        .map((candidate) => {
          if (candidate.key !== payload.candidateKey) return candidate;
          if (options?.mergedNoteId != null) {
            return {
              ...candidate,
              mergedNoteId: options.mergedNoteId,
              matches: [],
            };
          }
          if (options?.createdNoteId != null) {
            return null;
          }
          return candidate;
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate != null);
      saveImportUiState({ ...state, candidates: nextCandidates });
      clearResolveSession();
      router.replace("/import");
      return;
    }
    clearResolveSession();
    if (options?.mergedNoteId != null) {
      router.replace(`/notes/${options.mergedNoteId}`);
      return;
    }
    if (options?.createdNoteId != null) {
      router.replace(`/notes/${options.createdNoteId}`);
      return;
    }
    router.replace("/notes/new");
  }

  async function saveMerge() {
    if (!canvas || selectedId == null) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/bff/notes/${selectedId}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: canvas.title,
        statement: canvas.statement,
        approach: canvas.approach,
        code: canvas.code,
        pitfalls: normalizePitfalls(canvas.pitfalls),
        tags: canvas.tags,
        difficulty: clampDifficulty(canvas.difficulty),
      }),
    });
    const data = (await response.json()) as PracticeNote & { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? t("errors.couldNotMerge"));
      return;
    }
    returnToOrigin({ mergedNoteId: data.id });
  }

  async function keepAsNew() {
    if (!incoming) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/bff/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...incoming,
        difficulty: clampDifficulty(incoming.difficulty),
        pitfalls: normalizePitfalls(incoming.pitfalls),
      }),
    });
    const data = (await response.json()) as PracticeNote & { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? t("errors.couldNotCreate"));
      return;
    }
    returnToOrigin({ createdNoteId: data.id });
  }

  function goBack() {
    clearResolveSession();
    if (payload?.origin === "import") router.replace("/import");
    else router.replace("/notes/new");
  }

  if (isPending || !session) return null;

  if (!payload || !canvas || !baseline || !incoming || !incomingBaseline || !selectedMatch) {
    return (
      <div className="min-h-screen bg-canvas">
        <AppNav />
        <main className="mx-auto max-w-6xl space-y-4 p-5">
          <p className="text-muted">{t("empty")}</p>
          <Button onPress={() => router.replace("/notes")}>{tCommon("actions.backToNotes")}</Button>
        </main>
      </div>
    );
  }

  const canAi = (field: TextFieldKey | "pitfalls") => {
    const existing =
      field === "pitfalls" ? baseline.pitfalls.join("\n") : String(baseline[field] ?? "");
    const incomingText =
      field === "pitfalls" ? incoming.pitfalls.join("\n") : String(incoming[field] ?? "");
    return Boolean(existing.trim() && incomingText.trim());
  };

  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-7xl space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-accent">{t("eyebrow")}</p>
            <h1 className="text-3xl font-semibold text-foreground">{t("heading")}</h1>
            <p className="mt-1 text-sm text-muted">{t("hint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={goBack} isDisabled={busy}>
              {t("back")}
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">{t("matchesHeading")}</h2>
          <div className="flex flex-col gap-2">
            {payload.matches.map((match) => {
              const active = match.note.id === selectedId;
              return (
                <button
                  key={match.note.id}
                  type="button"
                  onClick={() => selectMatch(match)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:bg-raised/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{match.note.title}</span>
                    <span className="text-xs tabular-nums text-muted">
                      {t("score", { score: match.score.toFixed(2) })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-border bg-surface">
            <Card.Content className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t("incomingHeading")}</h2>
              <EditableField
                label={tCommon("fields.title")}
                value={incoming.title}
                onChange={(value) => updateIncoming("title", value)}
                onReverse={() => reverseIncomingField("title")}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <EditableField
                label={tCommon("fields.problemStatement")}
                value={incoming.statement}
                multiline
                rows={4}
                onChange={(value) => updateIncoming("statement", value)}
                onReverse={() => reverseIncomingField("statement")}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <EditableField
                label={tCommon("fields.approach")}
                value={incoming.approach}
                multiline
                rows={4}
                onChange={(value) => updateIncoming("approach", value)}
                onReverse={() => reverseIncomingField("approach")}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                  <FieldActions
                    onReverse={() => reverseIncomingField("code")}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <CodeField
                  value={incoming.code}
                  onChange={(value) => updateIncoming("code", value)}
                  language={codeLanguage}
                  minRows={6}
                  maxRows={14}
                />
              </div>
              <EditableField
                label={tCommon("fields.pitfalls")}
                value={incoming.pitfalls.join("\n")}
                multiline
                rows={3}
                onChange={(value) => updateIncoming("pitfalls", pitfallsFromText(value))}
                onReverse={() => reverseIncomingField("pitfalls")}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground/90">
                    {tCommon("fields.tags")}
                  </span>
                  <FieldActions
                    onReverse={() => reverseIncomingField("tags")}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <TagPicker
                  value={incoming.tags}
                  onChange={(tags) => updateIncoming("tags", tags)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel kind="difficulty">{tCommon("fields.difficulty")}</FieldLabel>
                  <FieldActions
                    onReverse={() => reverseIncomingField("difficulty")}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <DifficultyPicker
                  value={incoming.difficulty}
                  onChange={(value: DifficultyLevel) => updateIncoming("difficulty", value)}
                  showLegend={false}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                variant="secondary"
                onPress={keepAsNew}
                isPending={busy}
                className="w-full sm:w-auto"
              >
                {t("keepAsNew")}
              </Button>
            </Card.Content>
          </Card>

          <Card className="border border-border bg-surface">
            <Card.Content className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                {t("existingHeading", { id: selectedMatch.note.id })}
              </h2>

              <EditableField
                label={tCommon("fields.title")}
                value={canvas.title}
                onChange={(value) => updateCanvas("title", value)}
                onReverse={() => reverseExistingField("title")}
                onAiMerge={canAi("title") ? () => void aiMergeField("title") : undefined}
                aiPending={mergingField === "title"}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <EditableField
                label={tCommon("fields.problemStatement")}
                value={canvas.statement}
                multiline
                rows={4}
                onChange={(value) => updateCanvas("statement", value)}
                onReverse={() => reverseExistingField("statement")}
                onAiMerge={canAi("statement") ? () => void aiMergeField("statement") : undefined}
                aiPending={mergingField === "statement"}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <EditableField
                label={tCommon("fields.approach")}
                value={canvas.approach}
                multiline
                rows={4}
                onChange={(value) => updateCanvas("approach", value)}
                onReverse={() => reverseExistingField("approach")}
                onAiMerge={canAi("approach") ? () => void aiMergeField("approach") : undefined}
                aiPending={mergingField === "approach"}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
                  <FieldActions
                    onReverse={() => reverseExistingField("code")}
                    onAiMerge={canAi("code") ? () => void aiMergeField("code") : undefined}
                    aiPending={mergingField === "code"}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <CodeField
                  value={canvas.code}
                  onChange={(value) => updateCanvas("code", value)}
                  language={codeLanguage}
                  minRows={6}
                  maxRows={14}
                />
              </div>
              <EditableField
                label={tCommon("fields.pitfalls")}
                value={canvas.pitfalls.join("\n")}
                multiline
                rows={3}
                onChange={(value) => updateCanvas("pitfalls", pitfallsFromText(value))}
                onReverse={() => reverseExistingField("pitfalls")}
                onAiMerge={canAi("pitfalls") ? () => void aiMergeField("pitfalls") : undefined}
                aiPending={mergingField === "pitfalls"}
                reverseLabel={t("reverse")}
                aiLabel={t("aiMerge")}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground/90">
                    {tCommon("fields.tags")}
                  </span>
                  <FieldActions
                    onReverse={() => reverseExistingField("tags")}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <TagPicker value={canvas.tags} onChange={(tags) => updateCanvas("tags", tags)} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel kind="difficulty">{tCommon("fields.difficulty")}</FieldLabel>
                  <FieldActions
                    onReverse={() => reverseExistingField("difficulty")}
                    reverseLabel={t("reverse")}
                    aiLabel={t("aiMerge")}
                  />
                </div>
                <DifficultyPicker
                  value={canvas.difficulty}
                  onChange={(value: DifficultyLevel) => updateCanvas("difficulty", value)}
                  showLegend={false}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onPress={saveMerge} isPending={busy} className="w-full sm:w-auto">
                {t("saveMerge")}
              </Button>
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FieldActions({
  onReverse,
  onAiMerge,
  aiPending,
  reverseLabel,
  aiLabel,
}: {
  onReverse: () => void;
  onAiMerge?: () => void;
  aiPending?: boolean;
  reverseLabel: string;
  aiLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="tertiary" onPress={onReverse}>
        {reverseLabel}
      </Button>
      {onAiMerge ? (
        <Button size="sm" variant="tertiary" onPress={onAiMerge} isPending={aiPending}>
          {aiLabel}
        </Button>
      ) : null}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  onReverse,
  onAiMerge,
  aiPending,
  reverseLabel,
  aiLabel,
  multiline,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReverse: () => void;
  onAiMerge?: () => void;
  aiPending?: boolean;
  reverseLabel: string;
  aiLabel: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground/90">{label}</span>
        <FieldActions
          onReverse={onReverse}
          onAiMerge={onAiMerge}
          aiPending={aiPending}
          reverseLabel={reverseLabel}
          aiLabel={aiLabel}
        />
      </div>
      <TextField value={value} onChange={onChange}>
        {multiline ? (
          <TextArea rows={rows ?? 3} className="!text-base leading-relaxed" />
        ) : (
          <Input />
        )}
      </TextField>
    </div>
  );
}
