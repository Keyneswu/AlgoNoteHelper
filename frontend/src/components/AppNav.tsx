"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { authClient } from "@/lib/auth-client";

export function AppNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const links = [
    { href: "/notes", label: t("notes") },
    { href: "/import", label: t("import") },
    { href: "/ask", label: t("ask") },
    { href: "/settings", label: t("settings") },
  ];

  async function signOut() {
    // Hard-navigate with loggedOut=1 so the login page does not bounce back to
    // /notes on a stale useSession atom (felt like "logout instantly logs in").
    try {
      await authClient.signOut();
    } finally {
      window.location.assign("/login?loggedOut=1");
    }
  }

  return (
    <header className="border-b border-border bg-canvas/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-3">
        <Link href="/notes" className="mr-3 text-lg font-bold tracking-tight text-accent">
          {t("brand")}
        </Link>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <LocaleSwitcher />
        {!isPending &&
          (session ? (
            <Button size="sm" variant="tertiary" onPress={signOut}>
              {t("logout")}
            </Button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-accent-emphasis px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent"
            >
              {t("login")}
            </Link>
          ))}
      </nav>
    </header>
  );
}
