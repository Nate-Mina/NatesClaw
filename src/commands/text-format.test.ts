// Text format tests cover command-facing shortening helpers.
import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("natesclaw", 16)).toBe("natesclaw");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("natesclaw-status-output", 10)).toBe("natesclaw-…");
  });

  it("returns an empty string for non-positive limits", () => {
    expect(shortenText("natesclaw", 0)).toBe("");
    expect(shortenText("natesclaw", -1)).toBe("");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
