"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

export default function SetupPage() {
  const t = useTranslations("setup");
  const tCommon = useTranslations("common");
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
    if (!response.ok) return setError(data.error ?? t("errors.setupFailed"));
    router.replace("/login");
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
            <TextField isRequired name="name" value={name} onChange={setName}>
              <Label>{t("name")}</Label>
              <Input placeholder={t("namePlaceholder")} />
            </TextField>
            <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
              <Label>{t("email")}</Label>
              <Input placeholder={t("emailPlaceholder")} />
            </TextField>
            <TextField
              isRequired
              name="password"
              type="password"
              minLength={8}
              value={password}
              onChange={setPassword}
            >
              <Label>{t("password")}</Label>
              <Input placeholder={t("passwordPlaceholder")} />
            </TextField>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" isPending={saving}>
              {t("submit")}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
