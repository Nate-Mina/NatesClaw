import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  assertGatewayServiceMutationAllowed,
  formatExternalSupervisorUpdateRequired,
  isGatewayExternallySupervised,
  NON_DEFAULT_INSTALL_SERVICE_SKIP_REASON,
} from "./gateway-supervision.js";

// The env variable name is part of the observable contract the messages
// reference; the mode resolver is internal and proven through the public
// isGatewayExternallySupervised surface.
const GATEWAY_SUPERVISOR_MODE_ENV = "NATESCLAW_SUPERVISOR_MODE";

describe("gateway supervision", () => {
  it.each([
    { value: undefined, expected: "auto" },
    { value: "", expected: "auto" },
    { value: "auto", expected: "auto" },
    { value: "invalid", expected: "auto" },
    { value: " EXTERNAL ", expected: "external" },
  ])("resolves $value as $expected", ({ value, expected }) => {
    const env = { [GATEWAY_SUPERVISOR_MODE_ENV]: value };

    expect(isGatewayExternallySupervised(env)).toBe(expected === "external");
  });

  it("blocks native service mutation with actionable guidance", () => {
    expect(() =>
      assertGatewayServiceMutationAllowed("restart the gateway", {
        [GATEWAY_SUPERVISOR_MODE_ENV]: "external",
      }),
    ).toThrow(
      "Natesclaw gateway lifecycle is managed by an external supervisor " +
        "(NATESCLAW_SUPERVISOR_MODE=external). Use that supervisor to restart the gateway.",
    );
  });

  it.each([
    { NATESCLAW_STATE_DIR: "/tmp/copied-state" },
    { NATESCLAW_CONFIG_PATH: "/tmp/copied-natesclaw.json" },
  ])("blocks native service mutation for non-default install identity %#", (override) => {
    expect(() =>
      assertGatewayServiceMutationAllowed("restart the gateway", {
        HOME: "/home/operator",
        ...override,
      }),
    ).toThrow(
      `${NON_DEFAULT_INSTALL_SERVICE_SKIP_REASON}. Rerun with HOME set to the OS account home, without NATESCLAW_HOME, and with NATESCLAW_STATE_DIR and NATESCLAW_CONFIG_PATH either unset or pointing at the canonical paths for that account home and profile to restart the gateway.`,
    );
  });

  it("allows native service mutation for a named profile's canonical state dir", () => {
    const accountHome = os.userInfo().homedir;

    expect(() =>
      assertGatewayServiceMutationAllowed("restart the gateway", {
        HOME: accountHome,
        NATESCLAW_PROFILE: "work",
        NATESCLAW_STATE_DIR: path.join(accountHome, ".natesclaw-work"),
        NATESCLAW_CONFIG_PATH: path.join(accountHome, ".natesclaw-work", "natesclaw.json"),
      }),
    ).not.toThrow();
  });

  it.each([
    {
      platform: "darwin" as const,
      platformName: "macOS",
      envKey: "NATESCLAW_LAUNCHD_LABEL",
      value: "ai.natesclaw.gateway",
    },
    {
      platform: "linux" as const,
      platformName: "Linux",
      envKey: "NATESCLAW_SYSTEMD_UNIT",
      value: "natesclaw-gateway.service",
    },
    {
      platform: "win32" as const,
      platformName: "Windows",
      envKey: "NATESCLAW_WINDOWS_TASK_NAME",
      value: "Natesclaw Gateway",
    },
  ])(
    "rejects named-profile $envKey overrides on $platformName",
    ({ platform, platformName, envKey, value }) => {
      const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue(platform);
      const accountHome = os.userInfo().homedir;
      try {
        expect(() =>
          assertGatewayServiceMutationAllowed("restart the gateway", {
            HOME: accountHome,
            NATESCLAW_PROFILE: "work",
            NATESCLAW_STATE_DIR: path.join(accountHome, ".natesclaw-work"),
            NATESCLAW_CONFIG_PATH: path.join(accountHome, ".natesclaw-work", "natesclaw.json"),
            [envKey]: value,
          }),
        ).toThrow(
          `named profiles cannot override ${envKey} for ${platformName} service management`,
        );
      } finally {
        platformSpy.mockRestore();
      }
    },
  );

  it("rejects macOS profile names that collide with reserved LaunchAgent identities", () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
    try {
      expect(() =>
        assertGatewayServiceMutationAllowed("restart the gateway", {
          NATESCLAW_PROFILE: "gateway",
        }),
      ).toThrow('macOS profile "gateway" conflicts with a reserved LaunchAgent identity');
    } finally {
      platformSpy.mockRestore();
    }
  });

  it.each([
    { platform: "darwin" as const, platformName: "macOS" },
    { platform: "win32" as const, platformName: "Windows" },
  ])(
    "rejects case-distinct native service identities on $platformName",
    ({ platform, platformName }) => {
      const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue(platform);
      try {
        expect(() =>
          assertGatewayServiceMutationAllowed("restart the gateway", {
            NATESCLAW_PROFILE: "Main",
          }),
        ).toThrow(
          `${platformName} profile "Main" is not lowercase-safe for case-insensitive state and native-service paths`,
        );
      } finally {
        platformSpy.mockRestore();
      }
    },
  );

  it("explains why self-update must be delegated", () => {
    expect(formatExternalSupervisorUpdateRequired()).toContain(
      "stop the gateway, update and finalize the runtime, then restart it safely",
    );
  });
});
