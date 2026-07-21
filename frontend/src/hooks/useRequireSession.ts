"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Shared session gate for protected client pages.
 * Redirects to `/login` once the session query settles without a user.
 * Callers should still `return null` while `isPending || !session`.
 */
export function useRequireSession() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending || session) return;
    if (pathname === "/login") return;
    router.replace("/login");
  }, [isPending, pathname, router, session]);

  return { session, isPending };
}
