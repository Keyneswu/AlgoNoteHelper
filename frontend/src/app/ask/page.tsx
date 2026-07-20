"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { AskContextBar } from "@/components/AskContextBar";
import {
  AskRuntimeProvider,
  useMergeNotesAdded,
} from "@/components/AskRuntimeProvider";
import { AskThread } from "@/components/AskThread";
import { authClient } from "@/lib/auth-client";
import {
  clearAskSession,
  loadAskSession,
  saveAskSession,
  type AskChatMessage,
} from "@/lib/ask-store";
import { ALL_DIFFICULTY_LEVELS } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

/** Filters are intentionally not exposed in v1 UI — always search the full pool. */
const DEFAULT_FILTERS = {
  tags: [] as string[],
  difficulty: [...ALL_DIFFICULTY_LEVELS],
};

export default function AskPage() {
  const t = useTranslations("ask");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const initial = loadAskSession();
  const [contextNotes, setContextNotes] = useState<PracticeNote[]>(initial.contextNotes);
  const [messages, setMessages] = useState<AskChatMessage[]>(initial.messages);
  const [sessionKey, setSessionKey] = useState(0);
  const [ready, setReady] = useState(false);

  const onNotesAdded = useMergeNotesAdded(setContextNotes);
  const onTranscript = useCallback((next: AskChatMessage[]) => {
    setMessages(next);
  }, []);

  useEffect(() => {
    const saved = loadAskSession();
    // Session storage is client-only; hydrate after mount to keep the server snapshot stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContextNotes(saved.contextNotes);
    setMessages(saved.messages);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAskSession({
      tags: DEFAULT_FILTERS.tags,
      difficulty: DEFAULT_FILTERS.difficulty,
      contextNotes,
      messages,
    });
  }, [ready, contextNotes, messages]);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  function removeNote(noteId: number) {
    setContextNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function resetSession() {
    clearAskSession();
    setContextNotes([]);
    setMessages([]);
    setSessionKey((k) => k + 1);
  }

  if (isPending || !session) return null;

  return (
    <div className="ask-shell flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="shrink-0">
        <AppNav />
      </div>

      {ready ? (
        <AskRuntimeProvider
          key={sessionKey}
          filters={DEFAULT_FILTERS}
          contextNotes={contextNotes}
          initialMessages={messages}
          onNotesAdded={onNotesAdded}
          onTranscript={onTranscript}
        >
          <div className="flex min-h-0 flex-1">
            <aside className="ask-rail hidden w-[240px] shrink-0 md:flex md:flex-col lg:w-[260px]">
              <AskContextBar
                notes={contextNotes}
                onRemove={removeNote}
                onNewSession={resetSession}
                variant="rail"
              />
            </aside>

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-border/60 md:hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-2">
                  <p className="text-sm font-semibold text-foreground">{t("heading")}</p>
                  <Button size="sm" variant="tertiary" onPress={resetSession}>
                    {t("newSession")}
                  </Button>
                </div>
                <AskContextBar notes={contextNotes} onRemove={removeNote} variant="mobile" />
              </div>

              <div className="min-h-0 flex-1">
                <AskThread />
              </div>
            </section>
          </div>
        </AskRuntimeProvider>
      ) : null}
    </div>
  );
}
