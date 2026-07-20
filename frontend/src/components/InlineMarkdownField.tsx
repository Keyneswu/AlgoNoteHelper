"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { FieldLabel, type FieldKind } from "@/components/FieldLabel";
import { NoteMarkdown } from "@/components/NoteMarkdown";

export type InlineMarkdownLabels = {
  edit: string;
  source: string;
  preview: string;
  complete: string;
  cancel: string;
  empty: string;
};

type InlineMarkdownFieldProps = {
  kind: Extract<FieldKind, "statement" | "approach">;
  label: string;
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  labels: InlineMarkdownLabels;
  rows?: number;
  actions?: ReactNode;
  isEditDisabled?: boolean;
};

const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,summary,[role='button'],[contenteditable='true']";

export function InlineMarkdownField({
  kind,
  label,
  value,
  isEditing,
  onEdit,
  onChange,
  onComplete,
  onCancel,
  labels,
  rows = 8,
  actions,
  isEditDisabled = false,
}: InlineMarkdownFieldProps) {
  const [mode, setMode] = useState<"source" | "preview">("source");

  function activate(event?: MouseEvent<HTMLElement>) {
    if (isEditDisabled) return;
    if (event?.target instanceof Element) {
      const interactive = event.target.closest(INTERACTIVE_SELECTOR);
      if (interactive && interactive !== event.currentTarget) return;
    }
    if (window.getSelection()?.toString()) return;
    setMode("source");
    onEdit();
  }

  function complete() {
    setMode("source");
    onComplete();
  }

  function cancel() {
    setMode("source");
    onCancel();
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel kind={kind}>{label}</FieldLabel>
        {!isEditing && (
          <button
            type="button"
            className="rounded-md px-2.5 py-1 text-xs font-semibold text-muted transition hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35"
            disabled={isEditDisabled}
            onClick={() => {
              setMode("source");
              onEdit();
            }}
          >
            {labels.edit}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="overflow-hidden rounded-xl border border-accent/35 bg-inset/70 shadow-inner shadow-black/20">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex rounded-lg bg-canvas/70 p-0.5">
              {(["source", "preview"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    mode === item
                      ? "bg-accent-emphasis text-accent-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => setMode(item)}
                >
                  {item === "source" ? labels.source : labels.preview}
                </button>
              ))}
            </div>
          </div>

          {mode === "source" ? (
            <textarea
              value={value}
              rows={rows}
              autoFocus
              className="block w-full resize-y bg-transparent px-4 py-3 text-base leading-7 text-foreground outline-none placeholder:text-muted"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancel();
                }
              }}
            />
          ) : (
            <div className="min-h-40 px-4 py-3">
              {value.trim() ? (
                <NoteMarkdown content={value} />
              ) : (
                <p className="text-sm text-muted">{labels.empty}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-2 border-t border-border px-3 py-2">
            <div className="min-w-0 flex-1">{actions}</div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
                onClick={cancel}
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                className="rounded-md bg-accent-emphasis px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:bg-accent"
                onClick={complete}
              >
                {labels.complete}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={isEditDisabled ? -1 : 0}
          data-testid="markdown-activation"
          aria-label={`${labels.edit}: ${label}`}
          aria-disabled={isEditDisabled}
          className={`group min-h-16 rounded-xl border border-transparent bg-inset/35 px-4 py-3 transition focus-visible:border-accent focus-visible:outline-none ${
            isEditDisabled
              ? "cursor-not-allowed opacity-65"
              : "cursor-text hover:border-accent/30 hover:bg-inset/60"
          }`}
          onClick={activate}
          onKeyDown={(event) => {
            if (isEditDisabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMode("source");
              onEdit();
            }
          }}
        >
          {value.trim() ? (
            <NoteMarkdown content={value} />
          ) : (
            <p className="text-sm text-muted">{labels.empty}</p>
          )}
        </div>
      )}
    </section>
  );
}
