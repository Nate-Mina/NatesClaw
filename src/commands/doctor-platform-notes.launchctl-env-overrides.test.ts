// Doctor launchctl environment tests cover macOS gateway platform warnings for env overrides.
import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NatesclawConfig } from "../config/config.js";

const processMocks = vi.hoisted(() => ({
  runExec: vi.fn(),
}));

vi.mock("../process/exec.js", () => ({
  runExec: processMocks.runExec,
}));

import {
  collectMacGatewayPlatformWarnings,
  noteMacLaunchctlGatewayEnvOverrides,
  noteMacStaleNatesclawUpdateLaunchdJobs,
} from "./doctor-platform-notes.js";

function requireNoteCall(noteFn: { mock: { calls: unknown[][] } }, index = 0): unknown[] {
  const call = noteFn.mock.calls[index];
  if (!call) {
    throw new Error(`expected note call ${index}`);
  }
  return call;
}

describe("noteMacLaunchctlGatewayEnvOverrides", () => {
  beforeEach(() => {
    processMocks.runExec.mockReset().mockResolvedValue({ stdout: "", stderr: "" });
  });

  it("collects clear unsetenv instructions for token override", async () => {
    const noteFn = vi.fn();
    const getenv = vi.fn(async (name: string) =>
      name === "NATESCLAW_GATEWAY_TOKEN" ? "launchctl-token" : undefined,
    );
    const cfg = {
      gateway: {
        auth: {
          token: "config-token",
        },
      },
    } as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "darwin", getenv, noteFn });
    const [warning] = requireNoteCall(noteFn);

    expect(warning).toContain("Host-wide launchctl gateway auth overrides detected");
    expect(warning).toContain("NATESCLAW_GATEWAY_TOKEN");
    expect(warning).toContain("launchctl unsetenv NATESCLAW_GATEWAY_TOKEN");
    expect(warning).not.toContain("NATESCLAW_GATEWAY_PASSWORD");
  });

  it("prints clear unsetenv instructions for token override", async () => {
    const noteFn = vi.fn();
    const getenv = vi.fn(async (name: string) =>
      name === "NATESCLAW_GATEWAY_TOKEN" ? "launchctl-token" : undefined,
    );
    const cfg = {
      gateway: {
        auth: {
          token: "config-token",
        },
      },
    } as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "darwin", getenv, noteFn });

    expect(noteFn).toHaveBeenCalledTimes(1);
    expect(getenv).toHaveBeenCalledTimes(2);

    const [message, title] = requireNoteCall(noteFn);
    expect(title).toBe("Gateway (macOS)");
    expect(message).toContain("Host-wide launchctl gateway auth overrides detected");
    expect(message).toContain("Current managed Gateway installs do not need these values");
    expect(message).toContain("NATESCLAW_GATEWAY_TOKEN");
    expect(message).toContain("launchctl unsetenv NATESCLAW_GATEWAY_TOKEN");
    expect(message).not.toContain("NATESCLAW_GATEWAY_PASSWORD");
  });

  it("does nothing when config has no gateway credentials", async () => {
    const noteFn = vi.fn();
    const getenv = vi.fn(async () => "launchctl-token");
    const cfg = {} as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "darwin", getenv, noteFn });

    expect(getenv).not.toHaveBeenCalled();
    expect(noteFn).not.toHaveBeenCalled();
  });

  it("treats SecretRef-backed credentials as configured", async () => {
    const noteFn = vi.fn();
    const getenv = vi.fn(async (name: string) =>
      name === "NATESCLAW_GATEWAY_PASSWORD" ? "launchctl-password" : undefined,
    );
    const cfg = {
      gateway: {
        auth: {
          password: { source: "env", provider: "default", id: "NATESCLAW_GATEWAY_PASSWORD" },
        },
      },
      secrets: {
        providers: {
          default: { source: "env" },
        },
      },
    } as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "darwin", getenv, noteFn });

    expect(noteFn).toHaveBeenCalledTimes(1);
    const [message] = requireNoteCall(noteFn);
    expect(message).toContain("NATESCLAW_GATEWAY_PASSWORD");
  });

  it("does nothing on non-darwin platforms", async () => {
    const noteFn = vi.fn();
    const getenv = vi.fn(async () => "launchctl-token");
    const cfg = {
      gateway: {
        auth: {
          token: "config-token",
        },
      },
    } as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "linux", getenv, noteFn });

    expect(getenv).not.toHaveBeenCalled();
    expect(noteFn).not.toHaveBeenCalled();
  });

  it("bounds launchctl getenv calls and ignores timeout failures", async () => {
    const noteFn = vi.fn();
    processMocks.runExec.mockRejectedValue(new Error("timed out"));
    const cfg = {
      gateway: {
        auth: {
          token: "config-token",
        },
      },
    } as NatesclawConfig;

    await noteMacLaunchctlGatewayEnvOverrides(cfg, { platform: "darwin", noteFn });

    expect(processMocks.runExec).toHaveBeenNthCalledWith(
      1,
      "/bin/launchctl",
      ["getenv", "NATESCLAW_GATEWAY_TOKEN"],
      { logOutput: false, timeoutMs: 5_000 },
    );
    expect(processMocks.runExec).toHaveBeenNthCalledWith(
      2,
      "/bin/launchctl",
      ["getenv", "NATESCLAW_GATEWAY_PASSWORD"],
      { logOutput: false, timeoutMs: 5_000 },
    );
    expect(noteFn).not.toHaveBeenCalled();
  });
});

describe("noteMacStaleNatesclawUpdateLaunchdJobs", () => {
  it("uses service env for gateway platform stale updater warnings", async () => {
    const serviceEnv = {
      NATESCLAW_STATE_DIR: "/tmp/natesclaw-daemon",
      NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.manual-update.gateway",
    };
    const service = {
      readCommand: vi.fn(async () => ({
        programArguments: ["/bin/node", "cli", "gateway"],
        environment: serviceEnv,
      })),
    };
    const findJobs = vi.fn(async () => []);

    await collectMacGatewayPlatformWarnings({} as NatesclawConfig, {
      platform: "darwin",
      service,
      findJobs,
    });

    expect(service.readCommand).toHaveBeenCalledTimes(1);
    expect(findJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        NATESCLAW_STATE_DIR: "/tmp/natesclaw-daemon",
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.manual-update.gateway",
      }),
    );
  });

  it("uses service env for doctor stale updater notes", async () => {
    const serviceEnv = {
      NATESCLAW_STATE_DIR: "/tmp/natesclaw-daemon",
      NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.manual-update.gateway",
    };
    const service = {
      readCommand: vi.fn(async () => ({
        programArguments: ["/bin/node", "cli", "doctor"],
        environment: serviceEnv,
      })),
    };
    const findJobs = vi.fn(async () => []);

    await noteMacStaleNatesclawUpdateLaunchdJobs({
      platform: "darwin",
      service,
      findJobs,
    });

    expect(service.readCommand).toHaveBeenCalledTimes(1);
    expect(findJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        NATESCLAW_STATE_DIR: "/tmp/natesclaw-daemon",
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.manual-update.gateway",
      }),
    );
  });

  it("prints stale updater job cleanup guidance on macOS", async () => {
    const noteFn = vi.fn();
    const service = {
      readCommand: vi.fn(async () => null),
    };
    const findJobs = vi.fn(async () => [
      {
        label: "ai.natesclaw.update.2026.5.12",
        lastExitStatus: 127,
      },
      {
        label: "ai.natesclaw.manual-update.1717168800",
        lastExitStatus: 0,
      },
    ]);

    await noteMacStaleNatesclawUpdateLaunchdJobs({
      platform: "darwin",
      service,
      findJobs,
      noteFn,
    });

    expect(findJobs).toHaveBeenCalledTimes(1);
    const [message, title] = requireNoteCall(noteFn);
    expect(title).toBe("Gateway (macOS)");
    expect(message).toContain("Stale Natesclaw updater launchd job(s) detected");
    expect(message).toContain("ai.natesclaw.update.2026.5.12");
    expect(message).toContain("ai.natesclaw.manual-update.1717168800");
    expect(message).toContain("launchctl remove <label>");
    expect(message).toContain("natesclaw gateway restart");
  });

  it("does nothing when no stale updater jobs exist", async () => {
    const noteFn = vi.fn();
    const service = {
      readCommand: vi.fn(async () => null),
    };
    const findJobs = vi.fn(async () => []);

    await noteMacStaleNatesclawUpdateLaunchdJobs({
      platform: "darwin",
      service,
      findJobs,
      noteFn,
    });

    expect(noteFn).not.toHaveBeenCalled();
  });
});

describe("collectMacGatewayPlatformWarnings", () => {
  it("collects guidance when launch agent writes are disabled", async () => {
    const exists = vi
      .spyOn(fs, "existsSync")
      .mockImplementation((candidate) => String(candidate).includes("disable-launchagent"));
    try {
      const warnings = await collectMacGatewayPlatformWarnings({} as NatesclawConfig, {
        platform: "darwin",
        service: { readCommand: vi.fn(async () => null) },
        findJobs: vi.fn(async () => []),
      });

      expect(warnings).toEqual([expect.stringContaining("LaunchAgent writes are disabled")]);
      expect(warnings[0]).toContain("disable-launchagent");
    } finally {
      exists.mockRestore();
    }
  });

  it("does nothing when launch agent writes are not disabled", async () => {
    const exists = vi.spyOn(fs, "existsSync").mockReturnValue(false);
    try {
      await expect(
        collectMacGatewayPlatformWarnings({} as NatesclawConfig, {
          platform: "darwin",
          service: { readCommand: vi.fn(async () => null) },
          findJobs: vi.fn(async () => []),
        }),
      ).resolves.toEqual([]);
    } finally {
      exists.mockRestore();
    }
  });
});
