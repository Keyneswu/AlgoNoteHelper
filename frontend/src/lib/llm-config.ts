import { bffFetch } from "@/lib/bff";
import type { LlmConfig, LlmConfigUpdate } from "@/lib/types";

const LLM_CONFIG_BASE = "/api/bff/llm-config";
const NO_STORE: RequestInit = { cache: "no-store" };

export type LlmVerifyResult = {
  ok: boolean;
  message: string;
};

export async function getLlmConfig(): Promise<LlmConfig> {
  return bffFetch<LlmConfig>(LLM_CONFIG_BASE, NO_STORE);
}

export async function updateLlmConfig(body: LlmConfigUpdate): Promise<LlmConfig> {
  return bffFetch<LlmConfig>(LLM_CONFIG_BASE, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function verifyLlmConfig(kind: "chat" | "embedding"): Promise<LlmVerifyResult> {
  return bffFetch<LlmVerifyResult>(`${LLM_CONFIG_BASE}/verify`, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}
