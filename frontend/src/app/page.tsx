"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
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
    <main className="flex flex-1 items-center justify-center bg-canvas">
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium text-accent">{tCommon("brand")}</p>
        <p className="text-muted">{t("preparingWorkspace")}</p>
        <Button isDisabled>{tCommon("loading")}</Button>
      </div>
    </main>
  );
}
