"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";
import { PendingLabel } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const loggedOut = searchParams.get("loggedOut") === "1";
  const { data: session, isPending, refetch } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // After an explicit logout, stay on the form even if a stale client atom
    // briefly still looks signed-in. Otherwise logout appears to "auto login".
    if (loggedOut) return;
    if (!isPending && session) {
      window.location.replace("/notes");
    }
  }, [isPending, loggedOut, session]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setSaving(false);
      return setError(result.error.message ?? t("errors.couldNotSignIn"));
    }
    await refetch();
    // Hard navigate so protected pages mount with a settled session cookie.
    window.location.assign("/notes");
  }

  // After logout, always show the form (ignore stale session atom).
  if (session && !loggedOut) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas p-5">
        <p className="text-sm text-muted">{t("signingIn")}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas p-5">
      <Card className="w-full max-w-md border border-border bg-surface shadow-sm">
        <Card.Header className="border-b border-border">
          <div>
            <p className="text-sm font-semibold text-accent">{tCommon("brand")}</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{t("heading")}</h1>
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={submit}>
            <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
              <Label>{t("email")}</Label>
              <Input placeholder={t("emailPlaceholder")} />
            </TextField>
            <TextField isRequired name="password" type="password" value={password} onChange={setPassword}>
              <Label>{t("password")}</Label>
              <Input />
            </TextField>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" isPending={saving}>
              {({ isPending }) => (
                <PendingLabel pending={isPending}>{t("submit")}</PendingLabel>
              )}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-canvas p-5">
          <p className="text-sm text-muted">…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
