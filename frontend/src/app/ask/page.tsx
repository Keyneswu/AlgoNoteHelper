"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { AskContextBar } from "@/components/AskContextBar";
import { AskRailToggle, type AskRailMode } from "@/components/AskRailToggle";
import { AskRuntimeProvider } from "@/components/AskRuntimeProvider";
import { AskSessionList } from "@/components/AskSessionList";
import { AskThread } from "@/components/AskThread";
import { useRequireSession } from "@/hooks/useRequireSession";
import {
  createAskSession,
  deleteAskSession,
  getAskSession,
  listAskSessions,
  updateAskSession,
  type AskSessionDetail,
  type AskSessionListItem,
} from "@/lib/ask-sessions";
import {
  getActiveSessionId,
  mergeContextNotes,
  setActiveSessionId,
  type AskChatMessage,
} from "@/lib/ask-store";
import { ALL_DIFFICULTY_LEVELS } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

/** Filters are intentionally not exposed in v1 UI — always search the full pool. */
const DEFAULT_FILTERS = {
  tags: [] as string[],
  difficulty: [...ALL_DIFFICULTY_LEVELS],
};

function toListItem(detail: AskSessionDetail): AskSessionListItem {
  return {
    id: detail.id,
    title: detail.title,
    updated_at: detail.updated_at,
    created_at: detail.created_at,
    folder_id: detail.folder_id,
  };
}

function mapMessages(detail: AskSessionDetail): AskChatMessage[] {
  return detail.messages
    .filter(
      (m): m is typeof m & { role: AskChatMessage["role"] } =>
        m.role === "user" || m.role === "assistant" || m.role === "system",
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

function upsertSessionInList(
  items: AskSessionListItem[],
  item: AskSessionListItem,
): AskSessionListItem[] {
  const rest = items.filter((s) => s.id !== item.id);
  return [item, ...rest].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export default function AskPage() {
  const t = useTranslations("ask");
  const { session, isPending } = useRequireSession();

  const [railMode, setRailMode] = useState<AskRailMode>("sessions");
  const [sessions, setSessions] = useState<AskSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<number | null>(null);
  const [contextNotes, setContextNotes] = useState<PracticeNote[]>([]);
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const contextNotesRef = useRef(contextNotes);
  const activeSessionIdRef = useRef(activeSessionId);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    contextNotesRef.current = contextNotes;
  }, [contextNotes]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    setActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  const applySessionDetail = useCallback((detail: AskSessionDetail) => {
    setActiveSessionIdState(detail.id);
    setMessages(mapMessages(detail));
    setContextNotes(detail.context_notes ?? []);
    setSessionKey((k) => k + 1);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let { items } = await listAskSessions();
      if (items.length === 0) {
        const created = await createAskSession({ title: t("sessions.newChat") });
        ({ items } = await listAskSessions());
        if (items.length === 0) {
          items = [toListItem(created)];
        }
      }
      setSessions(items);

      const cached = getActiveSessionId();
      const preferId =
        cached != null && items.some((s) => s.id === cached)
          ? cached
          : items[0]?.id;
      if (preferId == null) {
        throw new Error(t("sessions.errorLoad"));
      }
      const detail = await getAskSession(preferId);
      applySessionDetail(detail);
      setRailMode("sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sessions.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [applySessionDetail, t]);

  useEffect(() => {
    if (isPending || !session || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void bootstrap();
  }, [bootstrap, isPending, session]);

  const selectSession = useCallback(
    async (id: number) => {
      if (id === activeSessionIdRef.current) {
        setRailMode("sessions");
        return;
      }
      setError("");
      try {
        const detail = await getAskSession(id);
        applySessionDetail(detail);
        setRailMode("sessions");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("sessions.errorLoad"));
      }
    },
    [applySessionDetail, t],
  );

  const newChat = useCallback(async () => {
    setError("");
    try {
      const created = await createAskSession({ title: t("sessions.newChat") });
      let { items } = await listAskSessions();
      if (!items.some((s) => s.id === created.id)) {
        items = upsertSessionInList(items, toListItem(created));
      }
      setSessions(items);
      setActiveSessionIdState(created.id);
      setMessages([]);
      setContextNotes([]);
      setSessionKey((k) => k + 1);
      setRailMode("sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sessions.errorSave"));
    }
  }, [t]);

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      setError("");
      try {
        await deleteAskSession(id);
        let { items } = await listAskSessions();
        if (items.length === 0) {
          const created = await createAskSession({ title: t("sessions.newChat") });
          ({ items } = await listAskSessions());
          if (items.length === 0) {
            items = [toListItem(created)];
          }
        }
        setSessions(items);

        if (id === activeSessionIdRef.current) {
          const nextId = items[0]?.id;
          if (nextId == null) {
            throw new Error(t("sessions.errorLoad"));
          }
          const detail = await getAskSession(nextId);
          applySessionDetail(detail);
          setRailMode("sessions");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("sessions.errorDelete"));
      } finally {
        setDeletingId(null);
      }
    },
    [applySessionDetail, t],
  );

  const onRunStart = useCallback(() => {
    setRailMode("notes");
  }, []);

  const onTranscript = useCallback(
    (next: AskChatMessage[]) => {
      setMessages(next);
      const id = activeSessionIdRef.current;
      if (id == null) return;

      const noteIds = contextNotesRef.current.map((n) => n.id);
      void (async () => {
        try {
          const updated = await updateAskSession(id, {
            messages: next,
            context_note_ids: noteIds,
          });
          setSessions((prev) => upsertSessionInList(prev, toListItem(updated)));
        } catch (err) {
          setError(err instanceof Error ? err.message : t("sessions.errorSave"));
        }
      })();
    },
    [t],
  );

  const onNotesAdded = useCallback((added: PracticeNote[]) => {
    if (!added.length) return;
    // Update ref synchronously so onTranscript PATCH (same turn) sees new ids
    // before React flushes the setState from the async SSE adapter.
    const next = mergeContextNotes(contextNotesRef.current, added);
    contextNotesRef.current = next;
    setContextNotes(next);
  }, []);

  const removeNote = useCallback(
    (noteId: number) => {
      setContextNotes((prev) => {
        const next = prev.filter((n) => n.id !== noteId);
        contextNotesRef.current = next;
        const id = activeSessionIdRef.current;
        if (id != null) {
          void updateAskSession(id, {
            context_note_ids: next.map((n) => n.id),
          }).catch((err: unknown) => {
            setError(err instanceof Error ? err.message : t("sessions.errorSave"));
          });
        }
        return next;
      });
    },
    [t],
  );

  if (isPending || !session) return null;

  const railBusy = loading;

  return (
    <div className="ask-shell flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="shrink-0">
        <AppNav />
      </div>

      <AskRuntimeProvider
        key={sessionKey}
        filters={DEFAULT_FILTERS}
        contextNotes={contextNotes}
        initialMessages={messages}
        onNotesAdded={onNotesAdded}
        onTranscript={onTranscript}
        onRunStart={onRunStart}
      >
        <div className="flex min-h-0 flex-1">
          <aside className="ask-rail hidden w-[240px] shrink-0 md:flex md:flex-col lg:w-[260px]">
            <div className="shrink-0 border-b border-border/60 px-3 py-2.5">
              <AskRailToggle
                value={railMode}
                onChange={setRailMode}
                isDisabled={railBusy}
              />
            </div>
            <div className="min-h-0 flex-1">
              {railMode === "sessions" ? (
                <AskSessionList
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  loading={loading}
                  disabled={railBusy}
                  onSelect={(id) => void selectSession(id)}
                  onNewChat={() => void newChat()}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              ) : (
                <AskContextBar
                  notes={contextNotes}
                  onRemove={removeNote}
                  variant="rail"
                />
              )}
            </div>
            {error ? (
              <p className="shrink-0 border-t border-border/60 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border/60 md:hidden">
              <div className="flex items-center gap-2 px-3 py-2">
                <AskRailToggle
                  value={railMode}
                  onChange={setRailMode}
                  isDisabled={railBusy}
                  className="shrink-0"
                />
                {railMode === "sessions" ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <select
                      className="min-w-0 flex-1 rounded-lg border border-border/70 bg-surface px-2 py-1.5 text-sm text-foreground"
                      value={activeSessionId ?? ""}
                      disabled={railBusy || sessions.length === 0}
                      aria-label={t("sessions.railSessions")}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (Number.isFinite(id) && id > 0) void selectSession(id);
                      }}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0"
                      isDisabled={railBusy}
                      onPress={() => void newChat()}
                    >
                      {t("sessions.newChat")}
                    </Button>
                  </div>
                ) : (
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {t("heading")}
                  </p>
                )}
              </div>
              {railMode === "notes" ? (
                <AskContextBar
                  notes={contextNotes}
                  onRemove={removeNote}
                  variant="mobile"
                />
              ) : null}
              {error ? (
                <p className="px-3 pb-2 text-xs text-danger md:hidden">{error}</p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1">
              <AskThread />
            </div>
          </section>
        </div>
      </AskRuntimeProvider>
    </div>
  );
}
