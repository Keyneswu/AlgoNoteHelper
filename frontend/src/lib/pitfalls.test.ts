import { describe, expect, it } from "vitest";
import {
  normalizePitfalls,
  removePitfall,
  replacePitfall,
  splitPitfallInput,
} from "@/lib/pitfalls";

describe("single-line pitfall helpers", () => {
  it("splits pasted lines, trims them, and drops blanks", () => {
    expect(splitPitfallInput(" first \n\n`second`\r\n third ")).toEqual([
      "first",
      "`second`",
      "third",
    ]);
  });

  it("normalizes embedded newlines into independent ordered items", () => {
    expect(normalizePitfalls(["first\nsecond", " ", "third"])).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("replaces one item with one or more normalized lines", () => {
    expect(replacePitfall(["one", "two", "three"], 1, "updated\nextra")).toEqual([
      "one",
      "updated",
      "extra",
      "three",
    ]);
  });

  it("removes only the selected item", () => {
    expect(removePitfall(["one", "two", "three"], 1)).toEqual(["one", "three"]);
  });
});
