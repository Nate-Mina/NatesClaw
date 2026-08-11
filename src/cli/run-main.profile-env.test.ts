// Run-main profile env tests cover profile environment handling in the CLI entrypoint.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureEnv, deleteTestEnvValue, setTestEnvValue } from "../test-utils/env.js";

const fileState = vi.hoisted(() => ({
  hasCliDotEnv: false,
}));

const dotenvState = vi.hoisted(() => {
  const state = {
    profileAtDotenvLoad: undefined as string | undefined,
    containerAtDotenvLoad: undefined as string | undefined,
  };
  return {
    state,
    loadDotEnv: vi.fn(() => {
      state.profileAtDotenvLoad = process.env.NATESCLAW_PROFILE;
      state.containerAtDotenvLoad = process.env.NATESCLAW_CONTAINER;
    }),
  };
});

const maybeRunCliInContainerMock = vi.hoisted(() =>
  vi.fn((argv: string[]) => ({ handled: false, argv })),
);

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  type ExistsSyncPath = Parameters<typeof actual.existsSync>[0];
  return {
    ...actual,
    existsSync: vi.fn((target: ExistsSyncPath) => {
      if (typeof target === "string" && target.endsWith(".env")) {
        return fileState.hasCliDotEnv;
      }
      return actual.existsSync(target);
    }),
  };
});

vi.mock("./dotenv.js", () => ({
  loadCliDotEnv: dotenvState.loadDotEnv,
}));

vi.mock("../infra/env.js", () => ({
  isTruthyEnvValue: (value?: string) =>
    typeof value === "string" && ["1", "on", "true", "yes"].includes(value.trim().toLowerCase()),
  normalizeEnv: vi.fn(),
}));

vi.mock("../infra/runtime-guard.js", () => ({
  assertSupportedRuntime: vi.fn(),
}));

vi.mock("../infra/path-env.js", () => ({
  ensureNatesclawCliOnPath: vi.fn(),
}));

vi.mock("./route.js", () => ({
  tryRouteCli: vi.fn(async () => true),
}));

vi.mock("./windows-argv.js", () => ({
  normalizeWindowsArgv: (argv: string[]) => argv,
}));

vi.mock("./container-target.js", async () => {
  const actual =
    await vi.importActual<typeof import("./container-target.js")>("./container-target.js");
  return {
    ...actual,
    maybeRunCliInContainer: maybeRunCliInContainerMock,
  };
});

import { runCli } from "./run-main.js";

describe("runCli profile env bootstrap", () => {
  const envSnapshot = captureEnv([
    "NATESCLAW_PROFILE",
    "NATESCLAW_STATE_DIR",
    "NATESCLAW_CONFIG_PATH",
    "NATESCLAW_CONTAINER",
    "NATESCLAW_GATEWAY_PORT",
    "NATESCLAW_GATEWAY_URL",
    "NATESCLAW_GATEWAY_TOKEN",
    "NATESCLAW_GATEWAY_PASSWORD",
  ]);

  beforeEach(() => {
    deleteTestEnvValue("NATESCLAW_PROFILE");
    deleteTestEnvValue("NATESCLAW_STATE_DIR");
    deleteTestEnvValue("NATESCLAW_CONFIG_PATH");
    deleteTestEnvValue("NATESCLAW_CONTAINER");
    deleteTestEnvValue("NATESCLAW_GATEWAY_PORT");
    deleteTestEnvValue("NATESCLAW_GATEWAY_URL");
    deleteTestEnvValue("NATESCLAW_GATEWAY_TOKEN");
    deleteTestEnvValue("NATESCLAW_GATEWAY_PASSWORD");
    dotenvState.state.profileAtDotenvLoad = undefined;
    dotenvState.state.containerAtDotenvLoad = undefined;
    dotenvState.loadDotEnv.mockClear();
    maybeRunCliInContainerMock.mockClear();
    fileState.hasCliDotEnv = false;
  });

  afterEach(() => {
    envSnapshot.restore();
  });

  it("applies --profile before dotenv loading", async () => {
    fileState.hasCliDotEnv = true;
    await runCli(["node", "natesclaw", "--profile", "rawdog", "status"]);

    expect(dotenvState.loadDotEnv).toHaveBeenCalledOnce();
    expect(dotenvState.state.profileAtDotenvLoad).toBe("rawdog");
    expect(process.env.NATESCLAW_PROFILE).toBe("rawdog");
  });

  it("rejects --container combined with --profile", async () => {
    await expect(
      runCli(["node", "natesclaw", "--container", "demo", "--profile", "rawdog", "status"]),
    ).rejects.toThrow("--container cannot be combined with --profile/--dev");

    expect(dotenvState.loadDotEnv).not.toHaveBeenCalled();
    expect(process.env.NATESCLAW_PROFILE).toBe("rawdog");
  });

  it("rejects --container combined with interleaved --profile", async () => {
    await expect(
      runCli(["node", "natesclaw", "status", "--container", "demo", "--profile", "rawdog"]),
    ).rejects.toThrow("--container cannot be combined with --profile/--dev");
  });

  it("rejects --container combined with interleaved --dev", async () => {
    await expect(
      runCli(["node", "natesclaw", "status", "--container", "demo", "--dev"]),
    ).rejects.toThrow("--container cannot be combined with --profile/--dev");
  });

  it("does not let dotenv change container target resolution", async () => {
    fileState.hasCliDotEnv = true;
    dotenvState.loadDotEnv.mockImplementationOnce(() => {
      process.env.NATESCLAW_CONTAINER = "demo";
      dotenvState.state.profileAtDotenvLoad = process.env.NATESCLAW_PROFILE;
      dotenvState.state.containerAtDotenvLoad = process.env.NATESCLAW_CONTAINER;
    });

    await runCli(["node", "natesclaw", "status"]);

    expect(dotenvState.loadDotEnv).toHaveBeenCalledOnce();
    expect(process.env.NATESCLAW_CONTAINER).toBe("demo");
    expect(dotenvState.state.containerAtDotenvLoad).toBe("demo");
    expect(maybeRunCliInContainerMock).toHaveBeenCalledWith(["node", "natesclaw", "status"]);
    expect(maybeRunCliInContainerMock).toHaveReturnedWith({
      handled: false,
      argv: ["node", "natesclaw", "status"],
    });
  });

  it("allows container mode when NATESCLAW_PROFILE is already set in env", async () => {
    setTestEnvValue("NATESCLAW_PROFILE", "work");

    await expect(
      runCli(["node", "natesclaw", "--container", "demo", "status"]),
    ).resolves.toBeUndefined();
  });

  it.each([
    ["NATESCLAW_GATEWAY_PORT", "19001"],
    ["NATESCLAW_GATEWAY_URL", "ws://127.0.0.1:18789"],
    ["NATESCLAW_GATEWAY_TOKEN", "demo-token"],
    ["NATESCLAW_GATEWAY_PASSWORD", "demo-password"],
  ])("allows container mode when %s is set in env", async (key, value) => {
    setTestEnvValue(key, value);

    await expect(
      runCli(["node", "natesclaw", "--container", "demo", "status"]),
    ).resolves.toBeUndefined();
  });

  it("allows container mode when only NATESCLAW_STATE_DIR is set in env", async () => {
    setTestEnvValue("NATESCLAW_STATE_DIR", "/tmp/natesclaw-host-state");

    await expect(
      runCli(["node", "natesclaw", "--container", "demo", "status"]),
    ).resolves.toBeUndefined();
  });

  it("allows container mode when only NATESCLAW_CONFIG_PATH is set in env", async () => {
    setTestEnvValue("NATESCLAW_CONFIG_PATH", "/tmp/natesclaw-host-state/natesclaw.json");

    await expect(
      runCli(["node", "natesclaw", "--container", "demo", "status"]),
    ).resolves.toBeUndefined();
  });
});
