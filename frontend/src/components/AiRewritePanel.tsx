"use client";

import { useRef, useState } from "react";
import {
  isRewriteCandidateStale,
  requestFieldRewrite,
  type FieldRewriteContext,
  type RewriteField,
  type RewriteOperation,
} from "@/lib/rewrite";

type QuickAction = {
  operation: Exclude<RewriteOperation, "custom">;
  label: string;
};

type ExternalAction = {
  id: string;
  label: string;
  run: () => Promise<string>;
};

export type AiRewriteLabels = {
  custom: string;
  instructionPlaceholder: string;
  runCustom: string;
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
  const [instruction, setInstruction] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  async function run(operation: RewriteOperation, customInstruction?: string) {
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
        instruction: customInstruction?.trim() || undefined,
        context,
      });
      if (requestId.current !== currentRequest) return;
      setCandidate({ before, after });
      if (operation === "custom") setShowCustom(false);
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {externalActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pendingOperation !== null}
            onClick={() => void runExternal(action)}
          >
            {pendingOperation === action.id ? `${action.label}…` : action.label}
          </button>
        ))}
        {quickActions.map((action) => (
          <button
            key={action.operation}
            type="button"
            className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!value.trim() || pendingOperation !== null}
            onClick={() => void run(action.operation)}
          >
            {pendingOperation === action.operation
              ? `${action.label}…`
              : action.label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-accent/30 hover:text-foreground disabled:opacity-50"
          disabled={!value.trim() || pendingOperation !== null}
          onClick={() => setShowCustom((shown) => !shown)}
        >
          {labels.custom}
        </button>
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

      {showCustom && (
        <div className="rounded-xl border border-accent/25 bg-canvas/70 p-3 shadow-lg shadow-black/20">
          <textarea
            rows={3}
            maxLength={2000}
            value={instruction}
            placeholder={labels.instructionPlaceholder}
            className="block w-full resize-y rounded-lg border border-border bg-inset px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            onChange={(event) => setInstruction(event.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="rounded-md bg-accent-emphasis px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-40"
              disabled={!instruction.trim() || pendingOperation !== null}
              onClick={() => void run("custom", instruction)}
            >
              {labels.runCustom}
            </button>
          </div>
        </div>
      )}

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
