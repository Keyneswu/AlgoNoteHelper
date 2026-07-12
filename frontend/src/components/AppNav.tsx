"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/notes", label: "Notes" },
  { href: "/import", label: "Import" },
  { href: "/ask", label: "Ask" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-3">
        <Link href="/notes" className="mr-3 text-lg font-bold tracking-tight text-teal-800">
          AlgoNoteHelper
        </Link>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {!isPending &&
          (session ? (
            <Button size="sm" variant="tertiary" onPress={signOut}>
              Logout
            </Button>
          ) : (
            <Link href="/login" className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Login</Link>
          ))}
      </nav>
    </header>
  );
}
