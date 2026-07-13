/** Split textarea value into lines without trimming (preserves spaces while typing). */
export function pitfallsFromText(value: string): string[] {
  return value.split("\n");
}

/** Normalize pitfalls for API/persistence: trim lines and drop blanks. */
export function normalizePitfalls(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}
