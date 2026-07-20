"use client";

import { useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import {
  isRewriteCandidateStale,
  requestFieldRewrite,
  type FieldRewriteContext,
  type RewriteField,
  type RewriteOperation,
} from "@/lib/rewrite";

type QuickAction = {
  operation: RewriteOperation;
  label: string;
};

type ExternalAction = {
  id: string;
  label: string;
  run: () => Promise<string>;
};

export type AiRewriteLabels = {
  apply: string;
  discard: string;
  undo: string;
  before: string;
  after: string;
  stale: string;
  errorFallback: string;
};

type AiRewritePanelProps = {
  field: RewriteField;
  value: string;
  context: FieldRewriteContext;
  quickActions: QuickAction[];
  externalActions?: ExternalAction[];
  onApply: (value: string) => void;
  labels: AiRewriteLabels;
};

type Candidate = {
  before: string;
  after: string;
};

type UndoState = {
  before: string;
  applied: string;
};

function PendingActionLabel({
  label,
  pending,
}: {
  label: string;
  pending: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {pending ? (
        <Spinner size="sm" color="current" className="size-3.5" />
      ) : null}
      {label}
    </span>
  );
}

export function AiRewritePanel({
  field,
  value,
  context,
  quickActions,
  externalActions = [],
  onApply,
  labels,
}: AiRewritePanelProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  async function run(operation: RewriteOperation) {
    const before = value;
    if (!before.trim()) return;
    const currentRequest = ++requestId.current;
    setPendingOperation(operation);
    setCandidate(null);
    setError("");
    try {
      const after = await requestFieldRewrite({
        field,
        operation,
        text: before,
        context,
      });
      if (requestId.current !== currentRequest) return;
      setCandidate({ before, after });
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      setError(cause instanceof Error ? cause.message : labels.errorFallback);
    } finally {
      if (requestId.current === currentRequest) setPendingOperation(null);
    }
  }

  async function runExternal(action: ExternalAction) {
    const before = value;
    const currentRequest = ++requestId.current;
    setPendingOperation(action.id);
    setCandidate(null);
    setError("");
    try {
      const after = await action.run();
      if (requestId.current !== currentRequest) return;
      setCandidate({ before, after });
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      setError(cause instanceof Error ? cause.message : labels.errorFallback);
    } finally {
      if (requestId.current === currentRequest) setPendingOperation(null);
    }
  }

  const stale = candidate
    ? isRewriteCandidateStale(candidate.before, value)
    : false;
  const canUndo = undo && value === undo.applied;
  const busy = pendingOperation !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {externalActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="inline-flex items-center rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            aria-busy={pendingOperation === action.id}
            onClick={() => void runExternal(action)}
          >
            <PendingActionLabel
              label={action.label}
              pending={pendingOperation === action.id}
            />
          </button>
        ))}
        {quickActions.map((action) => (
          <button
            key={action.operation}
            type="button"
            className="inline-flex items-center rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!value.trim() || busy}
            aria-busy={pendingOperation === action.operation}
            onClick={() => void run(action.operation)}
          >
            <PendingActionLabel
              label={action.label}
              pending={pendingOperation === action.operation}
            />
          </button>
        ))}
        {canUndo && (
          <button
            type="button"
            className="rounded-md px-2.5 py-1 text-xs font-semibold text-muted hover:bg-surface hover:text-foreground"
            onClick={() => {
              onApply(undo.before);
              setUndo(null);
            }}
          >
            {labels.undo}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}

      {candidate && (
        <div className="rounded-xl border border-accent/30 bg-canvas/70 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
                {labels.before}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-inset p-3 text-xs leading-5 text-muted">
                {candidate.before}
              </pre>
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
                {labels.after}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-accent/5 p-3 text-xs leading-5 text-foreground">
                {candidate.after}
              </pre>
            </div>
          </div>
          {stale && <p className="mt-2 text-xs text-amber-300">{labels.stale}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
              onClick={() => setCandidate(null)}
            >
              {labels.discard}
            </button>
            <button
              type="button"
              className="rounded-md bg-accent-emphasis px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stale}
              onClick={() => {
                setUndo({ before: candidate.before, applied: candidate.after });
                onApply(candidate.after);
                setCandidate(null);
              }}
            >
              {labels.apply}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
