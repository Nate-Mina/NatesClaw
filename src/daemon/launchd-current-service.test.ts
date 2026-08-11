// Launchd current service tests cover resolving active macOS service labels.
import { describe, expect, it } from "vitest";
import { isCurrentProcessLaunchdServiceLabel } from "./launchd-current-service.js";

describe("isCurrentProcessLaunchdServiceLabel", () => {
  it("matches launchd-provided service labels", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.natesclaw.gateway", {
        LAUNCH_JOB_LABEL: "ai.natesclaw.gateway",
      }),
    ).toBe(true);
  });

  it("falls back to Natesclaw service markers when XPC_SERVICE_NAME is inherited", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.natesclaw.gateway", {
        XPC_SERVICE_NAME: "0",
        NATESCLAW_SERVICE_MARKER: "natesclaw",
        NATESCLAW_SERVICE_KIND: "gateway",
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.gateway",
      }),
    ).toBe(true);
  });

  it("preserves label-only fallback when launchd exposes no label variables", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.natesclaw.gateway", {
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.gateway",
      }),
    ).toBe(true);
  });

  it("can require service markers for label-only fallback", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel(
        "ai.natesclaw.gateway",
        {
          NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.gateway",
        },
        { allowConfiguredLabelFallback: false },
      ),
    ).toBe(false);
  });

  it("does not treat unrelated inherited launchd labels as current services", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.natesclaw.gateway", {
        XPC_SERVICE_NAME: "0",
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.gateway",
      }),
    ).toBe(false);
  });
});
