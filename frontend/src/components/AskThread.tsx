"use client";

import type { FC } from "react";
import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
  useMessagePartText,
} from "@assistant-ui/react";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { AskAnswer } from "@/components/AskAnswer";

const MarkdownText: FC = () => {
  const { text } = useMessagePartText();
  const isRunning = useAuiState((s) => s.message.status?.type === "running");
  return <AskAnswer markdown={text} isStreaming={Boolean(isRunning)} />;
};

const PlainText: FC = () => {
  const { text } = useMessagePartText();
  return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
};

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end py-2">
      <div className="max-w-[85%] rounded-2xl bg-raised/80 px-4 py-2.5 text-sm text-foreground ring-1 ring-border/80">
        <MessagePrimitive.Parts components={{ Text: PlainText }} />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start py-2">
      <div className="w-full min-w-0 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 sm:px-5">
        <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  const t = useTranslations("ask");
  const aui = useAui();
  const isRunning = useAuiState((s) => s.thread.isRunning);

  return (
    <ComposerPrimitive.Root className="mx-auto flex w-full max-w-5xl items-end gap-2 rounded-2xl border border-border/80 bg-raised/50 p-2 ring-1 ring-inset ring-transparent focus-within:border-accent/40 focus-within:ring-accent/15">
      <ComposerPrimitive.Input
        rows={1}
        placeholder={t("composerPlaceholder")}
        className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted"
      />
      {isRunning ? (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onPress={() => aui.composer().cancel()}
        >
          {t("cancel")}
        </Button>
      ) : (
        <Button size="sm" className="shrink-0" onPress={() => aui.composer().send()}>
          {t("send")}
        </Button>
      )}
    </ComposerPrimitive.Root>
  );
}

export function AskThread() {
  const t = useTranslations("ask");

  return (
    <ThreadPrimitive.Root className="ask-thread flex h-full min-h-0 flex-col bg-canvas">
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col py-6">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <div className="flex flex-1 flex-col items-start justify-center gap-3 py-16">
              <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
                {t("eyebrow")}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t("welcomeHeading")}
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {t("welcomeHint")}
              </p>
            </div>
          </AuiIf>

          <ThreadPrimitive.Messages>
            {({ message }) =>
              message.role === "user" ? <UserMessage /> : <AssistantMessage />
            }
          </ThreadPrimitive.Messages>

          <div className="h-4 shrink-0" aria-hidden />
        </div>
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 bg-canvas/95 px-4 pt-2 pb-4 backdrop-blur">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
}
