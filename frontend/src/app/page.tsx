"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    async function route() {
      try {
        const response = await fetch("/api/setup");
        const setup = (await response.json()) as { needsSetup?: boolean };
        if (setup.needsSetup) router.replace("/setup");
        else router.replace(session ? "/notes" : "/login");
      } catch {
        router.replace(session ? "/notes" : "/login");
      }
    }
    void route();
  }, [isPending, router, session]);

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium text-teal-800">AlgoNoteHelper</p>
        <p className="text-slate-600">Preparing your workspace…</p>
        <Button isDisabled>Loading</Button>
      </div>
    </main>
  );
}
