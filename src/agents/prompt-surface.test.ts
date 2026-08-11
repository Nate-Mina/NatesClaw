// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildNatesclawToolFallbackText } from "./prompt-surface.js";
import { AUTOMATIONS_TOOL_NAME } from "./tools/automations-tool-name.js";

describe("buildNatesclawToolFallbackText", () => {
  it("teaches the canonical scheduler tool, never the legacy alias", () => {
    const text = buildNatesclawToolFallbackText({
      surface: "natesclaw_main",
      execToolName: "exec",
      processToolName: "process",
    });

    expect(text).toContain(`- ${AUTOMATIONS_TOOL_NAME}:`);
    // The fallback is model-facing guidance; it must not teach "cron" as a
    // tool name even though the inbound alias stays accepted (RFC 0026).
    expect(text).not.toMatch(/-\s*cron\b/);
    expect(text.toLowerCase()).not.toContain("cron job");
  });
});
