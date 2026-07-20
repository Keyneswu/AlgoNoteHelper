/** Split textarea value into lines without trimming (preserves spaces while typing). */
export function pitfallsFromText(value: string): string[] {
  return value.split("\n");
}

/** Split import/resolve composer text into non-empty, trimmed one-line items. */
export function splitPitfallInput(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Normalize pitfalls for API/persistence: trim and drop blanks; keep internal newlines. */
export function normalizePitfalls(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}

/** Replace one item while preserving order; value may contain internal newlines. */
export function replacePitfall(
  lines: string[],
  index: number,
  value: string,
): string[] {
  return [...lines.slice(0, index), value, ...lines.slice(index + 1)];
}

/** Remove one item while preserving the remaining order. */
export function removePitfall(lines: string[], index: number): string[] {
  return lines.filter((_, itemIndex) => itemIndex !== index);
}
