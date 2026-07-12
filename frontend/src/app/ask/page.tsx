"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, TextArea, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { NoteCard } from "@/components/NoteCard";
import { authClient } from "@/lib/auth-client";
import type { PracticeNote } from "@/lib/types";

type AskResult = { notes: PracticeNote[]; answer: string | null };

export default function AskPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  async function ask() {
    setLoading(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/bff/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) || undefined,
      }),
    });
    const data = (await response.json()) as AskResult & { error?: string };
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Could not ask your notes");
    setResult(data);
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
            <h2 className="text-xl font-semibold">Retrieved notes</h2>
            {result.notes.length ? (
              result.notes.map((note) => (
                <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
              ))
            ) : (
              <p className="text-slate-600">No relevant notes were found.</p>
            )}
            <Card className="border border-teal-200 bg-teal-50">
              <Card.Header>
                <h2 className="font-semibold">Answer</h2>
              </Card.Header>
              <Card.Content>
                <p className="whitespace-pre-wrap leading-7">{result.answer ?? "No answer returned."}</p>
              </Card.Content>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
