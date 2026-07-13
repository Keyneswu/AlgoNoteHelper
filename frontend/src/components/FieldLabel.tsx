import type { ReactNode } from "react";

export type FieldKind =
  | "title"
  | "statement"
  | "approach"
  | "code"
  | "tags"
  | "pitfalls"
  | "difficulty"
  | "practiceHistory";

const ICONS: Record<FieldKind, ReactNode> = {
  title: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M5 7h14M8 7v11M16 7v11M10 18h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  statement: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M6 5h12v14H6V5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 12h6M9 15h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  approach: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M12 4v3M12 17v3M4 12h3M17 12h3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  tags: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M4 11.5 11.5 4H19v7.5L11.5 19 4 11.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" />
    </svg>
  ),
  pitfalls: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M12 4.5 20.5 19H3.5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  ),
  difficulty: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M12 3c1.5 2.2.8 4.2.2 5.4-.4.8-.3 1.3.2 1.8 1.2 1.1 2.6.2 2.6-1.6 2.4 2.1 3.5 4.4 3.5 6.7A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-5.7C5.2 11.4 8.2 8.2 12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  ),
  practiceHistory: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-3.5">
      <path
        d="M7 4v2M17 4v2M4.5 9h15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6 6.5h12A1.5 1.5 0 0 1 19.5 8v11A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19V8A1.5 1.5 0 0 1 6 6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 13h2v2H9v-2Zm4 0h2v2h-2v-2Z" fill="currentColor" />
    </svg>
  ),
};

type FieldLabelProps = {
  kind: FieldKind;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
};

export function FieldLabel({ kind, children, htmlFor, className = "" }: FieldLabelProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent ring-1 ring-inset ring-accent/40">
        {ICONS[kind]}
      </span>
      <span className="text-sm font-semibold tracking-wide text-muted">
        {children}
      </span>
    </span>
  );

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className="block">
        {content}
      </label>
    );
  }
  return <div className="block">{content}</div>;
}
