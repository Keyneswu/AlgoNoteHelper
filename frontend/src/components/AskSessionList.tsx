"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertDialog, Button } from "@heroui/react";
import { Loader2, PanelLeftClose, Plus, Trash2 } from "lucide-react";
import { PendingLabel } from "@/components/icons";
import type { AskSessionListItem } from "@/lib/ask-sessions";

type AskSessionListProps = {
  sessions: AskSessionListItem[];
  activeSessionId: number | null;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void | Promise<void>;
  deletingId?: number | null;
  /** When set, shows a collapse control on the left of the header. */
  onCollapse?: () => void;
};

function formatShortUpdatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 14) return rtf.format(Math.round(diffSec / 86400), "day");
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function AskSessionList({
  sessions,
  activeSessionId,
  loading = false,
  disabled = false,
  onSelect,
  onNewChat,
  onDelete,
  deletingId = null,
  onCollapse,
}: AskSessionListProps) {
  const t = useTranslations("ask.sessions");
  const locale = useLocale();

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="shrink-0 px-4 pt-3 pb-3">
        <div
          className={`flex items-center gap-2 ${onCollapse ? "justify-between" : "justify-end"}`}
        >
          {onCollapse ? (
            <Button
              size="sm"
              variant="tertiary"
              isIconOnly
              className="shrink-0"
              aria-label={t("collapseRail")}
              isDisabled={disabled || loading}
              onPress={onCollapse}
            >
              <PanelLeftClose aria-hidden className="size-4" />
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            className="shrink-0"
            aria-label={t("newChat")}
            isDisabled={disabled || loading}
            onPress={onNewChat}
          >
            <Plus aria-hidden className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mx-4 h-px shrink-0 bg-border/70" aria-hidden />

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2" aria-busy={loading}>
        {loading ? (
          <div className="flex items-center justify-center py-6" role="status">
            <Loader2 aria-hidden className="size-5 animate-spin text-muted" />
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-2 py-6 text-sm leading-relaxed text-muted">{t("empty")}</p>
        ) : (
          sessions.map((session) => {
            const active = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group relative flex items-center gap-0.5 rounded-xl pr-0.5 transition ${
                  active ? "bg-accent/12" : "hover:bg-accent/8"
                }`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(session.id)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-2 pr-1 pl-3 text-left outline-offset-[-2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
                >
                  <span
                    className={`w-full truncate text-sm font-medium leading-snug ${
                      active ? "text-foreground" : "text-foreground"
                    }`}
                  >
                    {session.title}
                  </span>
                  <span className="text-[11px] leading-tight text-muted">
                    {formatShortUpdatedAt(session.updated_at, locale)}
                  </span>
                </button>

                <AlertDialog>
                  <Button
                    size="sm"
                    variant="tertiary"
                    isIconOnly
                    aria-label={t("deleteConfirmAction")}
                    isDisabled={disabled || deletingId === session.id}
                    className="h-7 w-7 shrink-0 min-w-7 px-0 text-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:text-danger data-[pressed]:opacity-100"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                  <AlertDialog.Backdrop>
                    <AlertDialog.Container>
                      <AlertDialog.Dialog className="sm:max-w-[400px]">
                        <AlertDialog.CloseTrigger />
                        <AlertDialog.Header>
                          <AlertDialog.Icon status="danger" />
                          <AlertDialog.Heading>{t("deleteHeading")}</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                          <p>{t("deleteConfirm")}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                          <Button
                            slot="close"
                            variant="tertiary"
                            isDisabled={deletingId === session.id}
                          >
                            {t("deleteCancel")}
                          </Button>
                          <Button
                            variant="danger"
                            isPending={deletingId === session.id}
                            onPress={() => void onDelete(session.id)}
                          >
                            {({ isPending }) => (
                              <PendingLabel pending={isPending}>
                                {t("deleteConfirmAction")}
                              </PendingLabel>
                            )}
                          </Button>
                        </AlertDialog.Footer>
                      </AlertDialog.Dialog>
                    </AlertDialog.Container>
                  </AlertDialog.Backdrop>
                </AlertDialog>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
