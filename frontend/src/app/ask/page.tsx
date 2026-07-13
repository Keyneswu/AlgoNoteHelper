"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Disclosure, Label, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { AskAnswer } from "@/components/AskAnswer";
import { DifficultyMultiSelect } from "@/components/DifficultyMultiSelect";
import { NoteCard } from "@/components/NoteCard";
import { TagPicker } from "@/components/TagPicker";
import { authClient } from "@/lib/auth-client";
import { consumeAskSse } from "@/lib/ask-sse";
import {
  loadAskUiState,
  saveAskUiState,
  type AskResult,
} from "@/lib/ask-store";
import { ALL_DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

function askPayload(question: string, tags: string[], difficulty: DifficultyLevel[]) {
  return {
    question,
    tags: tags.length ? tags : undefined,
    difficulty: difficulty.length ? difficulty : [...ALL_DIFFICULTY_LEVELS],
  };
}

async function askJson(
  question: string,
  tags: string[],
  difficulty: DifficultyLevel[],
  errorFallback: string,
): Promise<AskResult> {
  const response = await fetch("/api/bff/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(askPayload(question, tags, difficulty)),
  });
  const data = (await response.json()) as AskResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? errorFallback);
  }
  return data;
}

export default function AskPage() {
  const t = useTranslations("ask");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const initial = loadAskUiState();
  const [question, setQuestion] = useState(initial.question);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [difficulty, setDifficulty] = useState<DifficultyLevel[]>(initial.difficulty);
  const [result, setResult] = useState<AskResult | null>(initial.result);
  const [isStreaming, setIsStreaming] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(initial.notesExpanded);
  const [error, setError] = useState(initial.error);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadAskUiState();
    setQuestion(saved.question);
    setTags(saved.tags);
    setDifficulty(saved.difficulty);
    setResult(saved.result);
    setNotesExpanded(saved.notesExpanded);
    setError(saved.error);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAskUiState({ question, tags, difficulty, result, notesExpanded, error });
  }, [ready, question, tags, difficulty, result, notesExpanded, error]);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function ask() {
    setLoading(true);
    setError("");
    setResult({ notes: [], answer: "" });
    setIsStreaming(true);
    setNotesExpanded(false);

    const body = JSON.stringify(askPayload(question, tags, difficulty));
    const errorFallback = t("errors.couldNotAsk");

    try {
      const response = await fetch("/api/bff/ask/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body,
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
        const fallback = await askJson(question, tags, difficulty, errorFallback);
        setResult(fallback);
        return;
      }

      await consumeAskSse(response, {
        onNotes: (notes) => {
          setResult((prev) => ({
            notes: Array.isArray(notes) ? (notes as PracticeNote[]) : [],
            answer: prev?.answer ?? "",
          }));
        },
        onToken: (text) => {
          setResult((prev) => ({
            notes: prev?.notes ?? [],
            answer: (prev?.answer ?? "") + text,
          }));
        },
        onDone: () => {},
        onError: () => {
          /* consumeAskSse throws after this → JSON fallback */
        },
      });
    } catch {
      try {
        const fallback = await askJson(question, tags, difficulty, errorFallback);
        setResult(fallback);
        setError("");
      } catch (fallbackErr) {
        setResult(null);
        setError(
          fallbackErr instanceof Error
            ? fallbackErr.message
            : errorFallback,
        );
      }
    } finally {
      setIsStreaming(false);
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
            <TextField name="question" value={question} onChange={setQuestion}>
              <Label>{t("question")}</Label>
              <TextArea rows={4} placeholder={t("questionPlaceholder")} />
            </TextField>
            <div className="grid gap-4 md:grid-cols-2">
              <TagPicker
                variant="filter"
                value={tags}
                onChange={setTags}
                label={t("optionalTags")}
              />
              <DifficultyMultiSelect
                value={difficulty}
                onChange={setDifficulty}
                legend={t("difficulty")}
              />
            </div>
            <Button onPress={ask} isDisabled={!question.trim()} isPending={loading}>
              {t("submit")}
            </Button>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && (
          <section className="space-y-4">
            <Card className="border border-accent/30 bg-accent/10">
              <Card.Header>
                <h2 className="text-xl font-semibold text-accent">{t("answerHeading")}</h2>
              </Card.Header>
              <Card.Content>
                <AskAnswer
                  markdown={result.answer ?? ""}
                  isStreaming={isStreaming}
                />
              </Card.Content>
            </Card>

            <Disclosure
              isExpanded={notesExpanded}
              onExpandedChange={setNotesExpanded}
              className="rounded-xl border border-border bg-surface"
            >
              <Disclosure.Heading>
                <Button
                  slot="trigger"
                  variant="tertiary"
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-raised/50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {t("retrievedNotes")}
                      <span className="ml-2 font-normal text-muted">
                        {t("retrievedNotesCount", { count: result.notes.length })}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {t("retrievedNotesHint")}
                    </span>
                  </span>
                  <Disclosure.Indicator className="shrink-0 text-muted" />
                </Button>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="space-y-3 border-t border-border px-4 py-4">
                  {result.notes.length ? (
                    result.notes.map((note) => (
                      <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
                    ))
                  ) : (
                    <p className="text-sm text-muted">{t("noRelevantNotes")}</p>
                  )}
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          </section>
        )}
      </main>
    </div>
  );
}
