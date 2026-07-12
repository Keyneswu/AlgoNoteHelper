"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Disclosure, Input, Label, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { AskAnswer } from "@/components/AskAnswer";
import { NoteCard } from "@/components/NoteCard";
import { authClient } from "@/lib/auth-client";
import { consumeAskSse } from "@/lib/ask-sse";
import type { PracticeNote } from "@/lib/types";

type AskResult = { notes: PracticeNote[]; answer: string | null };

function askPayload(question: string, tags: string) {
  return {
    question,
    tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) || undefined,
  };
}

async function askJson(question: string, tags: string): Promise<AskResult> {
  const response = await fetch("/api/bff/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(askPayload(question, tags)),
  });
  const data = (await response.json()) as AskResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Could not ask your notes");
  }
  return data;
}

export default function AskPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function ask() {
    setLoading(true);
    setError("");
    setResult({ notes: [], answer: "" });
    setIsStreaming(true);
    setNotesExpanded(false);

    const body = JSON.stringify(askPayload(question, tags));

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
        // Non-SSE failure → JSON fallback
        const fallback = await askJson(question, tags);
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
        const fallback = await askJson(question, tags);
        setResult(fallback);
        setError("");
      } catch (fallbackErr) {
        setResult(null);
        setError(
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Could not ask your notes",
        );
      }
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-4xl space-y-6 p-5">
        <div>
          <p className="text-sm font-semibold text-teal-700">Grounded in your practice</p>
          <h1 className="text-3xl font-semibold">Ask your notes</h1>
        </div>
        <Card className="border border-slate-200 bg-white">
          <Card.Content className="space-y-4">
            <TextField name="question" value={question} onChange={setQuestion}>
              <Label>Question</Label>
              <TextArea rows={4} placeholder="When should I choose a monotonic stack?" />
            </TextField>
            <TextField name="tags" value={tags} onChange={setTags}>
              <Label>Optional tags</Label>
              <Input placeholder="stack, arrays" />
            </TextField>
            <Button onPress={ask} isDisabled={!question.trim()} isPending={loading}>
              Ask notes
            </Button>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {result && (
          <section className="space-y-4">
            <Card className="border border-teal-200 bg-teal-50">
              <Card.Header>
                <h2 className="text-xl font-semibold text-teal-950">Answer</h2>
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
              className="rounded-xl border border-slate-200 bg-white"
            >
              <Disclosure.Heading>
                <Button
                  slot="trigger"
                  variant="tertiary"
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">
                      Retrieved notes
                      <span className="ml-2 font-normal text-slate-500">
                        ({result.notes.length})
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      Sources used for this answer — expand to review
                    </span>
                  </span>
                  <Disclosure.Indicator className="shrink-0 text-slate-400" />
                </Button>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="space-y-3 border-t border-slate-100 px-4 py-4">
                  {result.notes.length ? (
                    result.notes.map((note) => (
                      <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No relevant notes were found.</p>
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
