/** Split textarea value into lines without trimming (preserves spaces while typing). */
export function pitfallsFromText(value: string): string[] {
  return value.split("\n");
}

/** Split composer or pasted text into non-empty, trimmed single-line items. */
export function splitPitfallInput(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Normalize pitfalls for API/persistence: split embedded lines, trim, and drop blanks. */
export function normalizePitfalls(lines: string[]): string[] {
  return lines.flatMap(splitPitfallInput);
}

/** Replace one item while preserving order; multiline input expands in place. */
export function replacePitfall(
  lines: string[],
  index: number,
  value: string,
): string[] {
  return [
    ...lines.slice(0, index),
    ...splitPitfallInput(value),
    ...lines.slice(index + 1),
  ];
}

/** Remove one item while preserving the remaining order. */
export function removePitfall(lines: string[], index: number): string[] {
  return lines.filter((_, itemIndex) => itemIndex !== index);
}
