"use client";

import { useState, type ClipboardEvent, type ReactNode } from "react";
import { FieldLabel } from "@/components/FieldLabel";
import { NoteMarkdown } from "@/components/NoteMarkdown";
import {
  removePitfall,
  replacePitfall,
  splitPitfallInput,
} from "@/lib/pitfalls";

export type PitfallBlockLabels = {
  label: string;
  addPlaceholder: string;
  add: string;
  edit: string;
  remove: string;
  complete: string;
  cancel: string;
  empty: string;
};

type PitfallBlocksProps = {
  value: string[];
  onChange: (value: string[]) => void;
  activeIndex: number | null;
  onBeginEdit: (index: number) => void;
  onCompleteEdit: () => void;
  onCancelEdit: () => void;
  labels: PitfallBlockLabels;
  actions?: (
    index: number,
    draftValue: string,
    setDraftValue: (value: string) => void,
  ) => ReactNode;
};

export function PitfallBlocks({
  value,
  onChange,
  activeIndex,
  onBeginEdit,
  onCompleteEdit,
  onCancelEdit,
  labels,
  actions,
}: PitfallBlocksProps) {
  const [composer, setComposer] = useState("");
  const [editDraft, setEditDraft] = useState<{
    index: number;
    value: string;
  } | null>(null);

  function append(raw: string) {
    const items = splitPitfallInput(raw);
    if (!items.length) return;
    onChange([...value, ...items]);
    setComposer("");
  }

  function pasteComposer(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!/[\r\n]/.test(pasted)) return;
    event.preventDefault();
    const start = event.currentTarget.selectionStart;
    const end = event.currentTarget.selectionEnd;
    append(`${composer.slice(0, start)}${pasted}${composer.slice(end)}`);
  }

  return (
    <section className="space-y-3">
      <FieldLabel kind="pitfalls">{labels.label}</FieldLabel>

      <div className="space-y-2">
        {!value.length && (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
            {labels.empty}
          </p>
        )}

        {value.map((pitfall, index) => {
          const isEditing = activeIndex === index;
          const draftValue =
            editDraft?.index === index ? editDraft.value : pitfall;
          return (
            <article
              key={index}
              data-testid="pitfall-block"
              className="group relative overflow-hidden rounded-xl border border-amber-400/20 bg-amber-400/[0.035] pl-11 transition hover:border-amber-400/35"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 flex w-10 items-start justify-center border-r border-amber-400/15 pt-3 font-mono text-xs font-semibold text-amber-300/80"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {isEditing ? (
                <div>
                  <input
                    autoFocus
                    aria-label={`${labels.edit} pitfall ${index + 1}`}
                    value={draftValue}
                    className="block w-full bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none"
                    onChange={(event) =>
                      setEditDraft({ index, value: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && draftValue.trim()) {
                        event.preventDefault();
                        onChange(replacePitfall(value, index, draftValue));
                        setEditDraft(null);
                        onCompleteEdit();
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        setEditDraft(null);
                        onCancelEdit();
                      }
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-400/15 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      {actions?.(index, draftValue, (next) =>
                        setEditDraft({ index, value: next }),
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
                        onClick={() => {
                          setEditDraft(null);
                          onCancelEdit();
                        }}
                      >
                        {labels.cancel}
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-300/25"
                        disabled={!draftValue.trim()}
                        onClick={() => {
                          onChange(replacePitfall(value, index, draftValue));
                          setEditDraft(null);
                          onCompleteEdit();
                        }}
                      >
                        {labels.complete}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-12 items-start gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <NoteMarkdown content={pitfall} variant="inline" />
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-amber-300/10 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
                      disabled={activeIndex !== null}
                      onClick={() => {
                        setEditDraft({ index, value: pitfall });
                        onBeginEdit(index);
                      }}
                    >
                      {labels.edit}
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
                      disabled={activeIndex !== null}
                      onClick={() => {
                        onChange(removePitfall(value, index));
                        if (activeIndex === index) onCompleteEdit();
                      }}
                    >
                      {labels.remove}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="flex items-start gap-2">
        <textarea
          rows={1}
          value={composer}
          placeholder={labels.addPlaceholder}
          className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-inset px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted focus:border-amber-300/50"
          onChange={(event) => setComposer(event.target.value.replace(/[\r\n]+/g, " "))}
          onPaste={pasteComposer}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              append(composer);
            }
          }}
        />
        <button
          type="button"
          className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!composer.trim()}
          onClick={() => append(composer)}
        >
          {labels.add}
        </button>
      </div>
    </section>
  );
}
