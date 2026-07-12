"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // If a session cookie already exists (e.g. after a bounce), go straight in.
  useEffect(() => {
    if (!isPending && session) router.replace("/notes");
  }, [isPending, router, session]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setSaving(false);
      return setError(result.error.message ?? "Could not sign in");
    }
    // Wait until the client session store reflects the new cookie.
    // Otherwise /notes sees stale { session: null, isPending: false } and
    // immediately redirects back to /login (double-login bug).
    // See: https://better-auth.com/docs/basic-usage#use-session
    await refetch();
    setSaving(false);
    router.replace("/notes");
  }

  if (isPending || session) {
    return (
      <main className="flex flex-1 items-center justify-center p-5">
        <p className="text-sm text-slate-600">Signing you in…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-sm">
        <Card.Header className="border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-teal-700">AlgoNoteHelper</p>
            <h1 className="mt-1 text-2xl font-semibold">Welcome back</h1>
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={submit}>
            <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
              <Label>Email</Label><Input placeholder="you@example.com" />
            </TextField>
            <TextField isRequired name="password" type="password" value={password} onChange={setPassword}>
              <Label>Password</Label><Input />
            </TextField>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" isPending={saving}>Log in</Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
