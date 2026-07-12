"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@heroui/react";
import { FieldLabel } from "@/components/FieldLabel";
import { PRESET_TAGS, displayTag, normalizeTag } from "@/lib/tags";

type TagPickerProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  name?: string;
  /** `form` shows FieldLabel + custom tags; `filter` is for search bars. */
  variant?: "form" | "filter";
  label?: string;
  allowCustom?: boolean;
};

export function TagPicker({
  value,
  onChange,
  name = "tags",
  variant = "form",
  label,
  allowCustom,
}: TagPickerProps) {
  const t = useTranslations("common");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const isFilter = variant === "filter";
  const canAddCustom = allowCustom ?? !isFilter;
  const selected = value.map(normalizeTag).filter(Boolean);
  const title = label ?? (isFilter ? t("fields.tags") : t("fields.tags"));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(tagId: string) {
    const id = normalizeTag(tagId);
    if (!id) return;
    if (selected.includes(id)) onChange(selected.filter((tag) => tag !== id));
    else onChange([...selected, id]);
  }

  function remove(tagId: string) {
    onChange(selected.filter((tag) => tag !== normalizeTag(tagId)));
  }

  function addCustom() {
    const id = normalizeTag(custom);
    if (!id) return;
    if (!selected.includes(id)) onChange([...selected, id]);
    setCustom("");
  }

  const customSelected = selected.filter(
    (tag) => !PRESET_TAGS.some((preset) => preset.id === tag),
  );

  return (
    <div ref={rootRef} className="relative space-y-2">
      {isFilter ? (
        <p className="text-sm font-medium text-foreground/90">{title}</p>
      ) : (
        <FieldLabel kind="tags">{title}</FieldLabel>
      )}
      <input type="hidden" name={name} value={selected.join(",")} readOnly />

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-inset px-3 py-2 text-left transition hover:border-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {selected.length ? (
          selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent ring-1 ring-inset ring-accent/40"
            >
              {displayTag(tag)}
              <span
                role="button"
                tabIndex={0}
                aria-label={t("tags.removeTagAriaLabel", { tag: displayTag(tag) })}
                className="rounded-full px-0.5 text-accent hover:bg-accent/20"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  remove(tag);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    remove(tag);
                  }
                }}
              >
                ×
              </span>
            </span>
          ))
        ) : (
          <span className="text-sm text-muted">
            {isFilter ? t("tags.filterTopics") : t("tags.chooseTopics")}
          </span>
        )}
        <span className="ml-auto text-xs font-medium text-accent">
          {open ? t("actions.close") : t("actions.add")}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface p-3 shadow-lg shadow-black/40"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t("tags.presets")}
          </p>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
            {PRESET_TAGS.map((preset) => {
              const active = selected.includes(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggle(preset.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                    active
                      ? "bg-accent/15 text-accent ring-accent/40"
                      : "bg-inset text-muted ring-border hover:bg-raised"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {!!customSelected.length && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("tags.yourTags")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {customSelected.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => remove(tag)}
                    className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/40"
                    title={t("tags.clickToRemove")}
                  >
                    {displayTag(tag)} ×
                  </button>
                ))}
              </div>
            </div>
          )}

          {canAddCustom && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {t("tags.newTag")}
              </p>
              <div className="flex gap-2">
                <Input
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  placeholder={t("tags.newTagPlaceholder")}
                  aria-label={t("tags.newTagAriaLabel")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustom();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isDisabled={!normalizeTag(custom)}
                  onPress={addCustom}
                >
                  {t("actions.add")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
