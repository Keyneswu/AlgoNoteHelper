"use client";

import type { ReactNode } from "react";
import { Loader2, type LucideProps } from "lucide-react";

/** Shared Lucide defaults for Ask (and other) decorative icon chrome. */
export const ASK_ICON_DEFAULTS = {
  size: 16,
  strokeWidth: 2,
  className: "size-4",
  "aria-hidden": true as const,
} satisfies LucideProps;

/** Merge Ask icon defaults; callers can override size, className, aria-*. */
export function askIconProps(overrides: LucideProps = {}): LucideProps {
  const { className, ...rest } = overrides;
  return {
    ...ASK_ICON_DEFAULTS,
    ...rest,
    className: className
      ? `${ASK_ICON_DEFAULTS.className} ${className}`
      : ASK_ICON_DEFAULTS.className,
  };
}

type AskLoaderProps = LucideProps;

/** Lucide spinner for Ask loading states. Prefer parent `aria-busy` over role=status. */
export function AskLoader({ className, ...props }: AskLoaderProps) {
  return (
    <Loader2
      {...askIconProps({
        ...props,
        className: className ? `animate-spin ${className}` : "animate-spin",
      })}
    />
  );
}

/**
 * HeroUI Button render-prop content: keeps the CTA label and shows Loader2 when pending.
 *
 * @example
 * <Button isPending={loading}>
 *   {({ isPending }) => (
 *     <PendingLabel pending={isPending}>{label}</PendingLabel>
 *   )}
 * </Button>
 * Spinner renders to the right of the label.
 */
export function PendingLabel({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      {pending ? <AskLoader className="size-3.5 shrink-0" /> : null}
    </span>
  );
}
