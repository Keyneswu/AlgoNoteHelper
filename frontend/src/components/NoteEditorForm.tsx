"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Form, Input, TextField } from "@heroui/react";
import { AiRewritePanel } from "@/components/AiRewritePanel";
import { CodeField } from "@/components/CodeField";
import { FieldLabel } from "@/components/FieldLabel";
import { InlineMarkdownField } from "@/components/InlineMarkdownField";
import { PitfallBlocks } from "@/components/PitfallBlocks";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { TagPicker } from "@/components/TagPicker";
import type { NoteMarkdownField } from "@/hooks/useNoteFieldEdit";
import type { DifficultyLevel } from "@/lib/difficulty";
import type { NoteDraft, PreferredCodeLanguage } from "@/lib/types";

type Props = {
  note: NoteDraft;
  onChange: (field: keyof NoteDraft, value: NoteDraft[keyof NoteDraft]) => void;
  codeLanguage: PreferredCodeLanguage;
  activeField: NoteMarkdownField | null;
  onBeginField: (field: NoteMarkdownField) => void;
  onCompleteField: () => void;
  onCancelField: (field: NoteMarkdownField) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Layout for tags/difficulty (+ optional side content). "stack" = new page; "split" = detail with PracticeHistory */
  metaLayout?: "stack" | "split";
  sideSlot?: ReactNode;
  footerSlot?: ReactNode;
  error?: string;
  titleInputPlaceholder?: string;
  titleRequired?: boolean;
};

export function NoteEditorForm({
  note,
  onChange,
  codeLanguage,
  activeField,
  onBeginField,
  onCompleteField,
  onCancelField,
  onSubmit,
  metaLayout = "stack",
  sideSlot,
  footerSlot,
  error,
  titleInputPlaceholder,
  titleRequired = true,
}: Props) {
  const tDetail = useTranslations("notes.detail");
  const tCommon = useTranslations("common");

  const aiLabels = {
    apply: tDetail("ai.apply"),
    discard: tDetail("ai.discard"),
    undo: tDetail("ai.undo"),
    before: tDetail("ai.before"),
    after: tDetail("ai.after"),
    stale: tDetail("ai.stale"),
    errorFallback: tDetail("ai.errorFallback"),
  };
  const markdownLabels = (empty: string) => ({
    edit: tDetail("markdown.edit"),
    source: tDetail("markdown.source"),
    preview: tDetail("markdown.preview"),
    complete: tDetail("markdown.complete"),
    cancel: tDetail("markdown.cancel"),
    empty,
    expand: tDetail("markdown.expand"),
    collapse: tDetail("markdown.collapse"),
  });
  const pitfallLabels = {
    label: tCommon("fields.pitfalls"),
    add: tDetail("pitfallBlocks.add"),
    remove: tDetail("pitfallBlocks.remove"),
    empty: tDetail("pitfallBlocks.empty"),
    expand: tDetail("pitfallBlocks.expand"),
    collapse: tDetail("pitfallBlocks.collapse"),
  };

  const tagsAndDifficulty = (
    <>
      <TagPicker value={note.tags} onChange={(tags) => onChange("tags", tags)} />
      <div className="space-y-2">
        <FieldLabel kind="difficulty">{tCommon("fields.difficulty")}</FieldLabel>
        <DifficultyPicker
          value={note.difficulty}
          onChange={(value: DifficultyLevel) => onChange("difficulty", value)}
          showLegend={false}
        />
      </div>
    </>
  );

  return (
    <Form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <TextField
        isRequired={titleRequired}
        name="title"
        value={note.title}
        onChange={(value) => onChange("title", value)}
      >
        <FieldLabel kind="title">{tCommon("fields.title")}</FieldLabel>
        <Input
          className="!text-xl font-semibold leading-snug"
          placeholder={titleInputPlaceholder}
        />
      </TextField>
      <InlineMarkdownField
        kind="statement"
        label={tCommon("fields.problemStatement")}
        value={note.statement}
        isEditing={activeField === "statement"}
        onEdit={() => onBeginField("statement")}
        onChange={(value) => onChange("statement", value)}
        onComplete={onCompleteField}
        onCancel={() => onCancelField("statement")}
        labels={markdownLabels(tDetail("markdown.emptyStatement"))}
        actions={
          <AiRewritePanel
            field="statement"
            value={note.statement}
            context={{ title: note.title }}
            quickActions={[
              {
                operation: "format_markdown",
                label: tDetail("ai.formatStatement"),
              },
            ]}
            onApply={(value) => onChange("statement", value)}
            labels={aiLabels}
          />
        }
      />
      <InlineMarkdownField
        kind="approach"
        label={tCommon("fields.approach")}
        value={note.approach}
        isEditing={activeField === "approach"}
        onEdit={() => onBeginField("approach")}
        onChange={(value) => onChange("approach", value)}
        onComplete={onCompleteField}
        onCancel={() => onCancelField("approach")}
        labels={markdownLabels(tDetail("markdown.emptyApproach"))}
        actions={
          <AiRewritePanel
            field="approach"
            value={note.approach}
            context={{
              title: note.title,
              statement: note.statement,
              tags: note.tags,
              code: note.code,
            }}
            quickActions={[
              {
                operation: "organize",
                label: tDetail("ai.organizeApproach"),
              },
            ]}
            onApply={(value) => onChange("approach", value)}
            labels={aiLabels}
          />
        }
      />
      <div className="space-y-2">
        <FieldLabel kind="code">{tCommon("fields.code")}</FieldLabel>
        <CodeField
          value={note.code}
          onChange={(value) => onChange("code", value)}
          language={codeLanguage}
          minRows={8}
          maxRows={22}
        />
      </div>
      <PitfallBlocks
        value={note.pitfalls}
        onChange={(value) => onChange("pitfalls", value)}
        labels={pitfallLabels}
      />
      {metaLayout === "split" ? (
        <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
          <div className="space-y-5">{tagsAndDifficulty}</div>
          {sideSlot}
        </div>
      ) : (
        <div className="space-y-5 sm:max-w-md">{tagsAndDifficulty}</div>
      )}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {footerSlot}
    </Form>
  );
}
