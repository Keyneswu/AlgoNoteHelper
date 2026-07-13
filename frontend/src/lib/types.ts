export type NoteDraft = {
  title: string;
  statement: string;
  approach: string;
  code: string;
  pitfalls: string[];
  tags: string[];
  difficulty: number;
  review_dates: string[];
  source_meta?: Record<string, unknown> | null;
};

export type PracticeNote = NoteDraft & {
  id: number;
  user_id: string;
  embedding_model: string | null;
  created_at: string;
  updated_at: string;
};

export type PreferredCodeLanguage = "java" | "python" | "cpp";

export type LlmConfig = {
  chat_provider: string;
  chat_base_url: string;
  chat_model: string;
  chat_api_key_hint: string | null;
  chat_verified: boolean;
  embedding_provider: string;
  embedding_base_url: string;
  embedding_model: string;
  embedding_api_key_hint: string | null;
  embedding_verified: boolean;
  preferred_code_language: PreferredCodeLanguage;
};

export type LlmConfigUpdate = Partial<
  Pick<
    LlmConfig,
    | "chat_provider"
    | "chat_base_url"
    | "chat_model"
    | "embedding_provider"
    | "embedding_base_url"
    | "embedding_model"
    | "preferred_code_language"
  >
> & {
  chat_api_key?: string;
  embedding_api_key?: string;
};

export const emptyNote: NoteDraft = {
  title: "",
  statement: "",
  approach: "",
  code: "",
  pitfalls: [],
  tags: [],
  /** Medium (yellow) — see `lib/difficulty.ts` (1 easy / 2 medium / 3 hard). */
  difficulty: 2,
  review_dates: [],
};
