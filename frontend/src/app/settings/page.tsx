"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { authClient } from "@/lib/auth-client";
import type { LlmConfig, LlmConfigUpdate, PreferredCodeLanguage } from "@/lib/types";

type AdminUser = { id: string; name: string; email: string; role?: string | null };

const CODE_LANGUAGE_IDS: PreferredCodeLanguage[] = ["java", "python", "cpp"];

const blankConfig: LlmConfig = {
  chat_provider: "deepseek",
  chat_base_url: "https://api.deepseek.com",
  chat_model: "deepseek-v4-pro",
  chat_api_key_hint: null,
  chat_verified: false,
  embedding_provider: "bailian",
  embedding_base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  embedding_model: "text-embedding-v3",
  embedding_api_key_hint: null,
  embedding_verified: false,
  preferred_code_language: "java",
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [config, setConfig] = useState<LlmConfig>(blankConfig);
  const [chatKey, setChatKey] = useState("");
  const [embeddingKey, setEmbeddingKey] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const isAdmin = (session?.user as { role?: string } | undefined)?.role?.split(",").includes("admin") ?? false;

  function apiKeyLabel(hint: string | null) {
    return hint ? t("fields.apiKeyWithHint", { hint }) : t("fields.apiKey");
  }

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, router, session]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const response = await fetch("/api/bff/llm-config");
      const data = (await response.json()) as LlmConfig & { error?: string };
      if (response.ok) setConfig(data);
      else setMessage(data.error ?? t("errors.couldNotLoadLlm"));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function save() {
    setSaving(true);
    setMessage("");
    const body: LlmConfigUpdate = {
      ...config,
      ...(chatKey ? { chat_api_key: chatKey } : {}),
      ...(embeddingKey ? { embedding_api_key: embeddingKey } : {}),
    };
    const response = await fetch("/api/bff/llm-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as LlmConfig & { error?: string };
    setSaving(false);
    if (!response.ok) return setMessage(data.error ?? t("errors.couldNotSave"));
    setConfig(data);
    setChatKey("");
    setEmbeddingKey("");
    setMessage(t("messages.settingsSaved"));
  }

  async function verify(kind: "chat" | "embedding") {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/bff/llm-config/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    setSaving(false);
    setMessage(data.message ?? data.error ?? t("errors.verificationFailed"));
    if (data.ok) setConfig((current) => ({ ...current, [`${kind}_verified`]: true }));
  }

  async function loadUsers() {
    const result = await authClient.admin.listUsers({ query: { limit: 100 } });
    if (result.error) return setMessage(result.error.message ?? t("errors.couldNotListUsers"));
    setUsers((result.data?.users ?? []) as AdminUser[]);
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const result = await authClient.admin.createUser({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: "user",
    });
    if (result.error) return setMessage(result.error.message ?? t("errors.couldNotCreateUser"));
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setMessage(t("messages.userCreated"));
    void loadUsers();
  }

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div>
          <p className="text-sm font-semibold text-accent">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t("heading")}</h1>
        </div>
        <Card className="border border-border bg-surface">
          <Card.Header>
            <h2 className="font-semibold text-foreground">{t("llmConfiguration")}</h2>
          </Card.Header>
          <Card.Content className="space-y-5">
            <section className="space-y-3">
              <h3 className="font-medium text-foreground">
                {t("chat.heading")}{" "}
                <span className={config.chat_verified ? "text-accent" : "text-amber-400"}>
                  {config.chat_verified ? t("chat.verified") : t("chat.notVerified")}
                </span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingField
                  label={t("fields.provider")}
                  value={config.chat_provider}
                  change={(value) => setConfig({ ...config, chat_provider: value })}
                />
                <SettingField
                  label={t("fields.baseUrl")}
                  value={config.chat_base_url}
                  change={(value) => setConfig({ ...config, chat_base_url: value })}
                />
                <SettingField
                  label={t("fields.model")}
                  value={config.chat_model}
                  change={(value) => setConfig({ ...config, chat_model: value })}
                />
                <SettingField
                  label={apiKeyLabel(config.chat_api_key_hint)}
                  value={chatKey}
                  change={setChatKey}
                  type="password"
                />
              </div>
              <Button size="sm" variant="secondary" onPress={() => verify("chat")} isPending={saving}>
                {t("chat.verify")}
              </Button>
            </section>
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-medium text-foreground">
                {t("embeddings.heading")}{" "}
                <span className={config.embedding_verified ? "text-accent" : "text-amber-400"}>
                  {config.embedding_verified ? t("embeddings.verified") : t("embeddings.notVerified")}
                </span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingField
                  label={t("fields.provider")}
                  value={config.embedding_provider}
                  change={(value) => setConfig({ ...config, embedding_provider: value })}
                />
                <SettingField
                  label={t("fields.baseUrl")}
                  value={config.embedding_base_url}
                  change={(value) => setConfig({ ...config, embedding_base_url: value })}
                />
                <SettingField
                  label={t("fields.model")}
                  value={config.embedding_model}
                  change={(value) => setConfig({ ...config, embedding_model: value })}
                />
                <SettingField
                  label={apiKeyLabel(config.embedding_api_key_hint)}
                  value={embeddingKey}
                  change={setEmbeddingKey}
                  type="password"
                />
              </div>
              <Button size="sm" variant="secondary" onPress={() => verify("embedding")} isPending={saving}>
                {t("embeddings.verify")}
              </Button>
            </section>
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-medium text-foreground">{t("editor.heading")}</h3>
              <Select
                className="max-w-xs"
                placeholder={t("editor.selectLanguagePlaceholder")}
                value={config.preferred_code_language}
                onChange={(value) => {
                  if (value === "java" || value === "python" || value === "cpp") {
                    setConfig({ ...config, preferred_code_language: value });
                  }
                }}
              >
                <Label>{t("editor.preferredCodeLanguage")}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {CODE_LANGUAGE_IDS.map((id) => (
                      <ListBox.Item key={id} id={id} textValue={t(`editor.languages.${id}`)}>
                        {t(`editor.languages.${id}`)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </section>
            {message && <p className="text-sm text-foreground/90">{message}</p>}
            <Button onPress={save} isPending={saving}>
              {t("saveConfiguration")}
            </Button>
          </Card.Content>
        </Card>
        {isAdmin && (
          <Card className="border border-border bg-surface">
            <Card.Header className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{t("admin.usersHeading")}</h2>
              <Button size="sm" variant="secondary" onPress={loadUsers}>
                {t("admin.loadUsers")}
              </Button>
            </Card.Header>
            <Card.Content className="space-y-5">
              <Form className="grid gap-3 sm:grid-cols-4" onSubmit={createUser}>
                <SettingField label={t("fields.name")} value={newName} change={setNewName} />
                <SettingField label={t("fields.email")} value={newEmail} change={setNewEmail} type="email" />
                <SettingField
                  label={t("fields.password")}
                  value={newPassword}
                  change={setNewPassword}
                  type="password"
                />
                <div className="self-end">
                  <Button type="submit">{t("admin.createUser")}</Button>
                </div>
              </Form>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between border-t border-border py-3 text-sm text-foreground"
                >
                  <span>
                    {user.name} · {user.email}
                  </span>
                  <span className="text-muted">{user.role ?? "user"}</span>
                </div>
              ))}
            </Card.Content>
          </Card>
        )}
      </main>
    </div>
  );
}

function SettingField({
  label,
  value,
  change,
  type = "text",
}: {
  label: string;
  value: string;
  change: (value: string) => void;
  type?: string;
}) {
  return (
    <TextField name={label} type={type} value={value} onChange={change}>
      <Label>{label}</Label>
      <Input />
    </TextField>
  );
}
