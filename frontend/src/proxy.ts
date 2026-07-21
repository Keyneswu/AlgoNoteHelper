import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic route gate (Next.js 16 proxy).
 *
 * Cookie presence only — not a cryptographic session check. Real auth still
 * happens in BFF / `auth.api.getSession` and `useRequireSession`.
 *
 * @see https://better-auth.com/docs/integrations/next#auth-protection
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/notes",
    "/notes/:path*",
    "/ask",
    "/ask/:path*",
    "/import",
    "/import/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
