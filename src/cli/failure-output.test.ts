// Failure output tests cover CLI error formatting and failure summaries.
import { describe, expect, it } from "vitest";
import { formatCliFailureLines } from "./failure-output.js";

describe("formatCliFailureLines", () => {
  it("shows a concise reason and recovery commands by default", () => {
    const lines = formatCliFailureLines({
      title: "Could not start the CLI.",
      error: new Error("config file is invalid"),
      argv: ["node", "natesclaw", "status"],
      env: {},
    });

    expect(lines).toEqual([
      "[natesclaw] Could not start the CLI.",
      "[natesclaw] Reason: config file is invalid",
      "[natesclaw] Debug: set NATESCLAW_DEBUG=1 to include the stack trace.",
      "[natesclaw] Try: natesclaw doctor",
      "[natesclaw] Help: natesclaw --help",
    ]);
  });

  it("prints stack details when debug output is requested", () => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      env: { NATESCLAW_DEBUG: "1" },
    });

    expect(lines.slice(0, 4)).toEqual([
      "[natesclaw] The CLI command failed.",
      "[natesclaw] Reason: boom",
      "[natesclaw] Stack:",
      "[natesclaw] Error: boom",
    ]);
    expect(lines.join("\n")).toContain("Error: boom");
  });

  it.each(["--debug", "--verbose"])("prints stack details for the root %s option", (debugFlag) => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      argv: ["node", "natesclaw", "proxy", "run", debugFlag],
      env: {},
    });

    expect(lines).toContain("[natesclaw] Stack:");
    expect(lines).toContain("[natesclaw] Error: boom");
  });

  it.each(["--debug", "--verbose"])(
    "does not enable root stack traces for a child %s option",
    (debugFlag) => {
      const lines = formatCliFailureLines({
        title: "The CLI command failed.",
        error: new Error("boom"),
        argv: ["node", "natesclaw", "proxy", "run", "--", "child", debugFlag],
        env: {},
      });

      expect(lines).not.toContain("[natesclaw] Stack:");
      expect(lines).toContain("[natesclaw] Debug: set NATESCLAW_DEBUG=1 to include the stack trace.");
    },
  );
});
