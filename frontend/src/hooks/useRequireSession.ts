"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type ClientSession = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>;

/**
 * Shared session gate for protected client pages.
 *
 * Always waits for an explicit `getSession()` round-trip before treating the
 * user as logged-out. Do NOT also bounce on a briefly-null `useSession()` atom
 * after that check succeeds — that recreates the login↔notes loop (sign-in
 * cookie is real; client atom has not caught up yet).
 */
export function useRequireSession() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: hookSession } = authClient.useSession();
  const [gatePending, setGatePending] = useState(true);
  const [verifiedSession, setVerifiedSession] = useState<ClientSession | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    // Defer setState so it is not sync in the effect body (lint rule).
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setGatePending(true);
      return authClient
        .getSession()
        .then(({ data }) => {
          if (cancelled) return;
          setVerifiedSession(data ?? null);
          setGatePending(false);
          if (!data && pathname !== "/login") {
            router.replace("/login");
          }
        })
        .catch(() => {
          if (cancelled) return;
          setVerifiedSession(null);
          setGatePending(false);
          if (pathname !== "/login") {
            router.replace("/login");
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Prefer the explicit getSession result once the gate has settled.
  const session = gatePending ? hookSession : verifiedSession;

  return {
    session,
    isPending: gatePending,
  };
}
