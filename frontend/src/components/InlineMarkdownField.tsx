"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { FieldLabel, type FieldKind } from "@/components/FieldLabel";
import { NoteMarkdown } from "@/components/NoteMarkdown";
import { askIconProps } from "@/components/icons";

export type InlineMarkdownLabels = {
  edit: string;
  source: string;
  preview: string;
  complete: string;
  cancel: string;
  empty: string;
  expand: string;
  collapse: string;
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

const COLLAPSE_MAX_VH = 50;

function CollapsibleRenderedMarkdown({
  content,
  emptyLabel,
  expandLabel,
  collapseLabel,
}: {
  content: string;
  emptyLabel: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function measure() {
      const node = contentRef.current;
      if (!node) return;
      const maxPx = window.innerHeight * (COLLAPSE_MAX_VH / 100);
      const overflows = node.scrollHeight > maxPx + 1;
      setNeedsCollapse(overflows);
      if (!overflows) setExpanded(false);
    }

    measure();
    window.addEventListener("resize", measure);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [content]);

  if (!content.trim()) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  const collapsed = needsCollapse && !expanded;

  return (
    <div className="space-y-2">
      <div
        ref={contentRef}
        data-testid="markdown-rendered"
        className={`overflow-hidden motion-reduce:transition-none ${
          collapsed ? "max-h-[50vh]" : ""
        } ${needsCollapse ? "transition-[max-height] duration-200 ease-out" : ""}`}
      >
        <NoteMarkdown content={content} />
      </div>
      {needsCollapse ? (
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={expanded ? collapseLabel : expandLabel}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? (
              <ChevronUp className="size-3.5" aria-hidden />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden />
            )}
            {expanded ? collapseLabel : expandLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

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
            className="inline-flex size-9 items-center justify-center rounded-md bg-accent-emphasis text-accent-foreground shadow-sm shadow-black/20 transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35"
            disabled={isEditDisabled}
            aria-label={labels.edit}
            onClick={() => {
              setMode("source");
              onEdit();
            }}
          >
            <Pencil {...askIconProps({ className: "size-4" })} />
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
              <CollapsibleRenderedMarkdown
                content={value}
                emptyLabel={labels.empty}
                expandLabel={labels.expand}
                collapseLabel={labels.collapse}
              />
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
          data-testid="markdown-reading"
          className="min-h-16 rounded-xl border border-transparent bg-inset/35 px-4 py-3"
        >
          <CollapsibleRenderedMarkdown
            content={value}
            emptyLabel={labels.empty}
            expandLabel={labels.expand}
            collapseLabel={labels.collapse}
          />
        </div>
      )}
    </section>
  );
}
