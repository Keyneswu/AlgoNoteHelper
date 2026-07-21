"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Shared session gate for protected client pages.
 *
 * Waits for an explicit `getSession()` round-trip before treating "no session"
 * as logged-out. Relying only on `useSession()` can briefly report
 * `{ isPending: false, data: null }` on first paint and bounce a valid user
 * from `/notes` → `/login` (then login sees the cookie and sends them back).
 */
export function useRequireSession() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [gatePending, setGatePending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGatePending(true);
    void authClient.getSession().then(({ data }) => {
      if (cancelled) return;
      setGatePending(false);
      if (!data && pathname !== "/login") {
        router.replace("/login");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    if (gatePending || isPending) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
  }, [gatePending, isPending, pathname, router, session]);

  return {
    session,
    isPending: isPending || gatePending,
  };
}
