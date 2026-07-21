"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type ReactNode,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { iterateAskSse } from "@/lib/ask-sse";
import { mergeContextNotes, type AskChatMessage } from "@/lib/ask-store";
import type { DifficultyLevel } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

export type AskFilters = {
  tags: string[];
  difficulty: DifficultyLevel[];
};

type AskRuntimeContextValue = {
  filtersRef: MutableRefObject<AskFilters>;
  contextNotesRef: MutableRefObject<PracticeNote[]>;
  onNotesAdded: (notes: PracticeNote[]) => void;
  onTranscript: (messages: AskChatMessage[]) => void;
};

const AskRuntimeContext = createContext<AskRuntimeContextValue | null>(null);

function extractText(message: ThreadMessage): string {
  if (typeof message.content === "string") return message.content;
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function toHistory(messages: readonly ThreadMessage[]): AskChatMessage[] {
  const out: AskChatMessage[] = [];
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = extractText(message);
    if (!content) continue;
    out.push({ role: message.role, content });
  }
  return out;
}

function parseNotesPayload(raw: unknown): PracticeNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((n): n is PracticeNote => {
    return Boolean(n && typeof n === "object" && typeof (n as PracticeNote).id === "number");
  });
}

type AskRuntimeProviderProps = {
  children: ReactNode;
  filters: AskFilters;
  contextNotes: PracticeNote[];
  initialMessages: AskChatMessage[];
  onNotesAdded: (notes: PracticeNote[]) => void;
  onTranscript: (messages: AskChatMessage[]) => void;
  /** Called when the user sends a question (adapter run starts). */
  onRunStart?: () => void;
};

export function AskRuntimeProvider({
  children,
  filters,
  contextNotes,
  initialMessages,
  onNotesAdded,
  onTranscript,
  onRunStart,
}: AskRuntimeProviderProps) {
  const filtersRef = useRef(filters);
  const contextNotesRef = useRef(contextNotes);
  const onNotesAddedRef = useRef(onNotesAdded);
  const onTranscriptRef = useRef(onTranscript);
  const onRunStartRef = useRef(onRunStart);

  useEffect(() => {
    filtersRef.current = filters;
    contextNotesRef.current = contextNotes;
    onNotesAddedRef.current = onNotesAdded;
    onTranscriptRef.current = onTranscript;
    onRunStartRef.current = onRunStart;
  }, [contextNotes, filters, onNotesAdded, onRunStart, onTranscript]);

  const adapter: ChatModelAdapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        if (!messages.length) return;
        const last = messages[messages.length - 1]!;
        const question = extractText(last);
        if (!question) return;

        onRunStartRef.current?.();

        const history = toHistory(messages.slice(0, -1));
        const { tags, difficulty } = filtersRef.current;
        const contextIds = contextNotesRef.current.map((n) => n.id);

        const response = await fetch("/api/bff/ask/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            question,
            messages: history,
            context_note_ids: contextIds,
            tags: tags.length ? tags : undefined,
            difficulty: difficulty.length ? difficulty : undefined,
          }),
          signal: abortSignal,
        });

        if (!response.ok || !response.body) {
          const errBody = await response.json().catch(() => ({}));
          const message =
            typeof errBody === "object" && errBody && "error" in errBody
              ? String((errBody as { error: unknown }).error)
              : `Ask failed (${response.status})`;
          throw new Error(message);
        }

        let text = "";
        for await (const event of iterateAskSse(response)) {
          if (event.type === "notes_added") {
            onNotesAddedRef.current(parseNotesPayload(event.notes));
          } else if (event.type === "token") {
            text += event.text;
            yield { content: [{ type: "text" as const, text }] };
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }

        onTranscriptRef.current([
          ...history,
          { role: "user", content: question },
          ...(text.trim()
            ? [{ role: "assistant" as const, content: text }]
            : []),
        ]);
      },
    }),
    [],
  );

  const threadMessages: ThreadMessageLike[] = useMemo(
    () =>
      initialMessages.map((m) => ({
        role: m.role,
        content: [{ type: "text" as const, text: m.content }],
      })),
    // Only seed once per mount — page remounts when navigating back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const runtime = useLocalRuntime(adapter, {
    initialMessages: threadMessages,
  });

  const ctx = useMemo<AskRuntimeContextValue>(
    () => ({
      filtersRef,
      contextNotesRef,
      onNotesAdded,
      onTranscript,
    }),
    [onNotesAdded, onTranscript],
  );

  return (
    <AskRuntimeContext.Provider value={ctx}>
      <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
    </AskRuntimeContext.Provider>
  );
}

export function useAskRuntimeContext() {
  const ctx = useContext(AskRuntimeContext);
  if (!ctx) throw new Error("useAskRuntimeContext must be used within AskRuntimeProvider");
  return ctx;
}

export function useMergeNotesAdded(
  setContextNotes: Dispatch<SetStateAction<PracticeNote[]>>,
) {
  return useCallback(
    (added: PracticeNote[]) => {
      if (!added.length) return;
      setContextNotes((prev) => mergeContextNotes(prev, added));
    },
    [setContextNotes],
  );
}
