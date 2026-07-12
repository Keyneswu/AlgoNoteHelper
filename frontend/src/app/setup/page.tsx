"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Setup failed");
    router.replace("/login");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <Card className="w-full max-w-md border border-slate-200 bg-white shadow-sm">
        <Card.Header className="border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-teal-700">AlgoNoteHelper</p>
            <h1 className="mt-1 text-2xl font-semibold">Create the administrator</h1>
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="flex flex-col gap-4" onSubmit={submit}>
            <TextField isRequired name="name" value={name} onChange={setName}>
              <Label>Name</Label><Input placeholder="Your name" />
            </TextField>
            <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
              <Label>Email</Label><Input placeholder="you@example.com" />
            </TextField>
            <TextField isRequired name="password" type="password" minLength={8} value={password} onChange={setPassword}>
              <Label>Password</Label><Input placeholder="At least 8 characters" />
            </TextField>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" isPending={saving}>Create administrator</Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
