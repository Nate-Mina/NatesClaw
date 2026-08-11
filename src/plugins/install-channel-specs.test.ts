import { describe, expect, it } from "vitest";
import {
  resolveClawHubInstallSpecsForUpdateChannel,
  resolveNpmInstallSpecsForUpdateChannel,
} from "./install-channel-specs.js";

describe("resolveNpmInstallSpecsForUpdateChannel", () => {
  it.each(["@natesclaw/discord", "@natesclaw/discord@latest"])(
    "targets the exact core version for official extended-stable intent %s",
    (spec) => {
      expect(
        resolveNpmInstallSpecsForUpdateChannel({
          spec,
          updateChannel: "extended-stable",
          officialPackageName: "@natesclaw/discord",
          coreVersion: "2026.7.33",
        }),
      ).toEqual({
        installSpec: "@natesclaw/discord@2026.7.33",
        recordSpec: spec,
      });
    },
  );

  it.each([
    "@natesclaw/discord@2026.6.33",
    "@natesclaw/discord@next",
    "@natesclaw/discord@beta",
    "@natesclaw/discord@^2026.6.0",
    "https://registry.example.test/discord.tgz",
  ])("preserves explicit extended-stable intent %s", (spec) => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec,
        updateChannel: "extended-stable",
        officialPackageName: "@natesclaw/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: spec, recordSpec: spec });
  });

  it("does not rewrite a third-party package", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@acme/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@natesclaw/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: "@acme/discord", recordSpec: "@acme/discord" });
  });

  it("fails closed without an authoritative extended-stable core version", () => {
    expect(() =>
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@natesclaw/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@natesclaw/discord",
      }),
    ).toThrow("requires an exact core version");
  });

  it("preserves beta behavior", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@natesclaw/discord@latest",
        updateChannel: "beta",
        officialPackageName: "@natesclaw/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({
      installSpec: "@natesclaw/discord@beta",
      recordSpec: "@natesclaw/discord@latest",
      fallbackSpec: "@natesclaw/discord@latest",
      fallbackLabel: "@natesclaw/discord@beta",
    });
  });
});

describe("resolveClawHubInstallSpecsForUpdateChannel", () => {
  it("does not rewrite ClawHub on extended-stable", () => {
    expect(
      resolveClawHubInstallSpecsForUpdateChannel({
        spec: "clawhub:@natesclaw/discord",
        updateChannel: "extended-stable",
      }),
    ).toEqual({
      installSpec: "clawhub:@natesclaw/discord",
      recordSpec: "clawhub:@natesclaw/discord",
    });
  });
});
