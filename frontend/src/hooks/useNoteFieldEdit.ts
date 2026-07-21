import { useState } from "react";

export type NoteMarkdownField = "statement" | "approach";

export function useNoteFieldEdit(initialActive: NoteMarkdownField | null = null) {
  const [activeField, setActiveField] = useState<NoteMarkdownField | null>(initialActive);
  const [fieldSnapshot, setFieldSnapshot] = useState("");

  function beginField(field: NoteMarkdownField, currentValue: string) {
    setFieldSnapshot(currentValue);
    setActiveField(field);
  }

  function cancelField(_field: NoteMarkdownField, onRestore: (value: string) => void) {
    onRestore(fieldSnapshot);
    setActiveField(null);
  }

  function completeField() {
    setActiveField(null);
  }

  return { activeField, beginField, cancelField, completeField, setActiveField };
}
