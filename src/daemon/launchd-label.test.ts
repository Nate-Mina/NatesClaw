// Launchd label tests keep lifecycle, handoff, update, and discovery resolution aligned.
import { describe, expect, it } from "vitest";
import { resolveLaunchAgentLabel } from "./launchd-label.js";

describe("resolveLaunchAgentLabel", () => {
  it("resolves default, profile, and explicit labels", () => {
    expect(resolveLaunchAgentLabel()).toBe("ai.natesclaw.gateway");
    expect(resolveLaunchAgentLabel({ NATESCLAW_PROFILE: "work" })).toBe("ai.natesclaw.work");
    expect(
      resolveLaunchAgentLabel({
        NATESCLAW_PROFILE: "work",
        NATESCLAW_LAUNCHD_LABEL: "com.example.gateway",
      }),
    ).toBe("com.example.gateway");
  });

  it("rejects labels that cannot be passed safely to launchd", () => {
    expect(() =>
      resolveLaunchAgentLabel({ NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.$(echo injected)" }),
    ).toThrow("Invalid launchd label");
  });
});
