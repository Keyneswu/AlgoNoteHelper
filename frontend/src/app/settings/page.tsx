"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { authClient } from "@/lib/auth-client";
import type { LlmConfig, LlmConfigUpdate, PreferredCodeLanguage } from "@/lib/types";

type AdminUser = { id: string; name: string; email: string; role?: string | null };

const CODE_LANGUAGES: { id: PreferredCodeLanguage; label: string }[] = [
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
  { id: "cpp", label: "C++" },
];

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
  const router = useRouter(); const { data: session, isPending } = authClient.useSession();
  const [config, setConfig] = useState<LlmConfig>(blankConfig); const [chatKey, setChatKey] = useState(""); const [embeddingKey, setEmbeddingKey] = useState("");
  const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false); const [users, setUsers] = useState<AdminUser[]>([]);
  const [newName, setNewName] = useState(""); const [newEmail, setNewEmail] = useState(""); const [newPassword, setNewPassword] = useState("");
  const isAdmin = (session?.user as { role?: string } | undefined)?.role?.split(",").includes("admin") ?? false;
  useEffect(() => { if (!isPending && !session) router.replace("/login"); }, [isPending, router, session]);
  useEffect(() => { if (!session) return; void (async () => { const response = await fetch("/api/bff/llm-config"); const data = await response.json() as LlmConfig & { error?: string }; if (response.ok) setConfig(data); else setMessage(data.error ?? "Could not load LLM settings"); })(); }, [session]);
  async function save() {
    setSaving(true); setMessage("");
    const body: LlmConfigUpdate = { ...config, ...(chatKey ? { chat_api_key: chatKey } : {}), ...(embeddingKey ? { embedding_api_key: embeddingKey } : {}) };
    const response = await fetch("/api/bff/llm-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as LlmConfig & { error?: string }; setSaving(false);
    if (!response.ok) return setMessage(data.error ?? "Could not save settings");
    setConfig(data); setChatKey(""); setEmbeddingKey(""); setMessage("Settings saved.");
  }
  async function verify(kind: "chat" | "embedding") {
    setSaving(true); setMessage("");
    const response = await fetch("/api/bff/llm-config/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    const data = await response.json() as { ok?: boolean; message?: string; error?: string }; setSaving(false); setMessage(data.message ?? data.error ?? "Verification failed");
    if (data.ok) setConfig((current) => ({ ...current, [`${kind}_verified`]: true }));
  }
  async function loadUsers() {
    const result = await authClient.admin.listUsers({ query: { limit: 100 } });
    if (result.error) return setMessage(result.error.message ?? "Could not list users");
    setUsers(((result.data?.users ?? []) as AdminUser[]));
  }
  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const result = await authClient.admin.createUser({ name: newName, email: newEmail, password: newPassword, role: "user" });
    if (result.error) return setMessage(result.error.message ?? "Could not create user");
    setNewName(""); setNewEmail(""); setNewPassword(""); setMessage("User created."); void loadUsers();
  }
  if (isPending || !session) return null;
  return <div className="min-h-screen"><AppNav /><main className="mx-auto max-w-4xl space-y-6 p-5">
    <div><p className="text-sm font-semibold text-teal-700">Your providers</p><h1 className="text-3xl font-semibold">Settings</h1></div>
    <Card className="border border-slate-200 bg-white"><Card.Header><h2 className="font-semibold">LLM configuration</h2></Card.Header><Card.Content className="space-y-5">
      <section className="space-y-3"><h3 className="font-medium">Chat <span className={config.chat_verified ? "text-teal-700" : "text-amber-700"}>{config.chat_verified ? "verified" : "not verified"}</span></h3>
        <div className="grid gap-3 sm:grid-cols-2"><SettingField label="Provider" value={config.chat_provider} change={(value) => setConfig({ ...config, chat_provider: value })} /><SettingField label="Base URL" value={config.chat_base_url} change={(value) => setConfig({ ...config, chat_base_url: value })} /><SettingField label="Model" value={config.chat_model} change={(value) => setConfig({ ...config, chat_model: value })} /><SettingField label={`API key ${config.chat_api_key_hint ? `(${config.chat_api_key_hint})` : ""}`} value={chatKey} change={setChatKey} type="password" /></div>
        <Button size="sm" variant="secondary" onPress={() => verify("chat")} isPending={saving}>Verify chat</Button>
      </section>
      <section className="space-y-3 border-t border-slate-100 pt-5"><h3 className="font-medium">Embeddings <span className={config.embedding_verified ? "text-teal-700" : "text-amber-700"}>{config.embedding_verified ? "verified" : "not verified"}</span></h3>
        <div className="grid gap-3 sm:grid-cols-2"><SettingField label="Provider" value={config.embedding_provider} change={(value) => setConfig({ ...config, embedding_provider: value })} /><SettingField label="Base URL" value={config.embedding_base_url} change={(value) => setConfig({ ...config, embedding_base_url: value })} /><SettingField label="Model" value={config.embedding_model} change={(value) => setConfig({ ...config, embedding_model: value })} /><SettingField label={`API key ${config.embedding_api_key_hint ? `(${config.embedding_api_key_hint})` : ""}`} value={embeddingKey} change={setEmbeddingKey} type="password" /></div>
        <Button size="sm" variant="secondary" onPress={() => verify("embedding")} isPending={saving}>Verify embeddings</Button>
      </section>
      <section className="space-y-3 border-t border-slate-100 pt-5">
        <h3 className="font-medium">Editor</h3>
        <Select
          className="max-w-xs"
          placeholder="Select language"
          value={config.preferred_code_language}
          onChange={(value) => {
            if (value === "java" || value === "python" || value === "cpp") {
              setConfig({ ...config, preferred_code_language: value });
            }
          }}
        >
          <Label>Preferred code language</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {CODE_LANGUAGES.map((lang) => (
                <ListBox.Item key={lang.id} id={lang.id} textValue={lang.label}>
                  {lang.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </section>
      {message && <p className="text-sm text-slate-700">{message}</p>}<Button onPress={save} isPending={saving}>Save configuration</Button>
    </Card.Content></Card>
    {isAdmin && <Card className="border border-slate-200 bg-white"><Card.Header className="flex items-center justify-between"><h2 className="font-semibold">Admin: users</h2><Button size="sm" variant="secondary" onPress={loadUsers}>Load users</Button></Card.Header><Card.Content className="space-y-5">
      <Form className="grid gap-3 sm:grid-cols-4" onSubmit={createUser}><SettingField label="Name" value={newName} change={setNewName} /><SettingField label="Email" value={newEmail} change={setNewEmail} type="email" /><SettingField label="Password" value={newPassword} change={setNewPassword} type="password" /><div className="self-end"><Button type="submit">Create user</Button></div></Form>
      {users.map((user) => <div key={user.id} className="flex justify-between border-t border-slate-100 py-3 text-sm"><span>{user.name} · {user.email}</span><span className="text-slate-600">{user.role ?? "user"}</span></div>)}
    </Card.Content></Card>}
  </main></div>;
}

function SettingField({ label, value, change, type = "text" }: { label: string; value: string; change: (value: string) => void; type?: string }) {
  return <TextField name={label} type={type} value={value} onChange={change}><Label>{label}</Label><Input /></TextField>;
}
