"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/FieldLabel";
import { removePitfall, replacePitfall } from "@/lib/pitfalls";

const VISIBLE_WHEN_COLLAPSED = 6;

export type PitfallBlockLabels = {
  label: string;
  add: string;
  remove: string;
  empty: string;
  expand: string;
  collapse: string;
};

type PitfallBlocksProps = {
  value: string[];
  onChange: (value: string[]) => void;
  labels: PitfallBlockLabels;
};

export function PitfallBlocks({ value, onChange, labels }: PitfallBlocksProps) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = value.length > VISIBLE_WHEN_COLLAPSED;
  const visibleItems =
    needsCollapse && !expanded
      ? value.slice(0, VISIBLE_WHEN_COLLAPSED)
      : value;

  return (
    <section className="w-full space-y-3">
      <FieldLabel kind="pitfalls">{labels.label}</FieldLabel>

      {!value.length ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
          {labels.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleItems.map((pitfall, index) => (
              <article
                key={index}
                data-testid="pitfall-block"
                className="flex flex-col overflow-hidden rounded-xl border border-amber-400/20 bg-amber-400/[0.035] transition hover:border-amber-400/35"
              >
                <div className="flex items-start gap-0 border-b border-amber-400/15">
                  <span
                    aria-hidden
                    className="flex w-10 shrink-0 items-start justify-center pt-3 font-mono text-xs font-semibold text-amber-300/80"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <textarea
                    aria-label={`Pitfall ${index + 1}`}
                    rows={3}
                    value={pitfall}
                    className="max-h-48 min-h-[4.5rem] w-full flex-1 resize-y overflow-y-auto bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none"
                    onChange={(event) =>
                      onChange(replacePitfall(value, index, event.target.value))
                    }
                  />
                </div>
                <div className="flex justify-end px-3 py-2">
                  <button
                    type="button"
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:bg-red-400/10 hover:text-red-300"
                    onClick={() => onChange(removePitfall(value, index))}
                  >
                    {labels.remove}
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-300/20"
          onClick={() => {
            const next = [...value, ""];
            onChange(next);
            if (next.length > VISIBLE_WHEN_COLLAPSED) setExpanded(true);
          }}
        >
          {labels.add}
        </button>
        {needsCollapse ? (
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? labels.collapse : labels.expand}
          </button>
        ) : null}
      </div>
    </section>
  );
}
