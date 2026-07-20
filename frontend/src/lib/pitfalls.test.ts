import { describe, expect, it } from "vitest";
import {
  normalizePitfalls,
  removePitfall,
  replacePitfall,
  splitPitfallInput,
} from "@/lib/pitfalls";

describe("multiline pitfall helpers", () => {
  it("splits pasted lines, trims them, and drops blanks for import-style textareas", () => {
    expect(splitPitfallInput(" first \n\n`second`\r\n third ")).toEqual([
      "first",
      "`second`",
      "third",
    ]);
  });

  it("normalizes by trimming and dropping blanks without splitting on newlines", () => {
    expect(normalizePitfalls(["first\nsecond", " ", "third"])).toEqual([
      "first\nsecond",
      "third",
    ]);
  });

  it("replaces one item while keeping internal newlines in that item", () => {
    expect(replacePitfall(["one", "two", "three"], 1, "updated\nextra")).toEqual([
      "one",
      "updated\nextra",
      "three",
    ]);
  });

  it("removes only the selected item", () => {
    expect(removePitfall(["one", "two", "three"], 1)).toEqual(["one", "three"]);
  });
});
