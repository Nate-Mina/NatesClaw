// Tests compile-cache child-process spawning and environment propagation.
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutoCleanupTempDirTracker } from "../test/helpers/temp-dir.js";
import { resolveEntryInstallRoot } from "./entry.compile-cache.js";
import {
  buildNatesclawCompileCacheRespawnPlan,
  isNodeVersionAffectedByCompileCacheDeadlock,
  isSourceCheckoutInstallRoot,
  resolveNatesclawCompileCacheDirectory,
  runNatesclawCompileCacheRespawnPlan,
  shouldEnableNatesclawCompileCache,
} from "./entry.compile-cache.test-support.js";

function requireFirstMockCall(mock: { mock: { calls: unknown[][] } }, label: string): unknown[] {
  const [call] = mock.mock.calls;
  if (!call) {
    throw new Error(`expected ${label} call`);
  }
  return call;
}

describe("entry compile cache", () => {
  const tempDirs = useAutoCleanupTempDirTracker(afterEach);

  it("resolves install roots from source and dist entry paths", () => {
    expect(resolveEntryInstallRoot("/repo/natesclaw/src/entry.ts")).toBe("/repo/natesclaw");
    expect(resolveEntryInstallRoot("/repo/natesclaw/dist/entry.js")).toBe("/repo/natesclaw");
    expect(resolveEntryInstallRoot("/pkg/natesclaw/entry.js")).toBe("/pkg/natesclaw");
  });

  it("treats git and source entry markers as source checkouts", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-source-");
    await fs.writeFile(path.join(root, ".git"), "gitdir: .git/worktrees/natesclaw\n", "utf8");

    expect(isSourceCheckoutInstallRoot(root)).toBe(true);
  });

  it("disables compile cache for source-checkout installs", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-src-entry-");
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "entry.ts"), "export {};\n", "utf8");

    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
      }),
    ).toBe(false);
  });

  it("keeps compile cache enabled for packaged installs unless disabled by env", () => {
    const root = tempDirs.make("natesclaw-compile-cache-package-");

    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.15.0",
        platform: "win32",
      }),
    ).toBe(true);
    expect(
      shouldEnableNatesclawCompileCache({
        env: { NODE_DISABLE_COMPILE_CACHE: "1" },
        installRoot: root,
        nodeVersion: "24.15.0",
        platform: "win32",
      }),
    ).toBe(false);
  });

  it("scopes packaged compile cache by package install metadata", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-package-key-");
    const packageJsonPath = path.join(root, "package.json");
    await fs.writeFile(packageJsonPath, '{"version":"2026.4.29"}\n', "utf8");

    const directory = resolveNatesclawCompileCacheDirectory({
      env: { NODE_COMPILE_CACHE: path.join(root, ".node-cache") },
      installRoot: root,
    });

    expect(directory).toContain(path.join(".node-cache", "natesclaw"));
    expect(directory).toContain("2026.4.29");
    expect(path.basename(directory)).toMatch(/^\d+-\d+$/);
  });

  it("invalidates a replaced installation without deleting shared compile caches", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-package-reinstall-");
    const packageJsonPath = path.join(root, "package.json");
    const cacheRoot = path.join(root, ".node-cache");
    await fs.writeFile(packageJsonPath, '{"version":"2026.4.29"}\n', "utf8");

    const originalDirectory = resolveNatesclawCompileCacheDirectory({
      env: { NODE_COMPILE_CACHE: cacheRoot },
      installRoot: root,
    });
    await fs.mkdir(originalDirectory, { recursive: true });
    const originalCacheEntry = path.join(originalDirectory, "keep.txt");
    await fs.writeFile(originalCacheEntry, "previous cached installation\n", "utf8");

    await fs.writeFile(
      packageJsonPath,
      '{"version":"2026.4.29","installation":"replacement"}\n',
      "utf8",
    );
    const replacementDirectory = resolveNatesclawCompileCacheDirectory({
      env: { NODE_COMPILE_CACHE: cacheRoot },
      installRoot: root,
    });

    expect(replacementDirectory).toContain(path.join("natesclaw", "2026.4.29"));
    expect(replacementDirectory).not.toBe(originalDirectory);
    await expect(fs.readFile(originalCacheEntry, "utf8")).resolves.toBe(
      "previous cached installation\n",
    );
  });

  it("builds a one-shot no-cache respawn plan when source checkout inherits NODE_COMPILE_CACHE", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-respawn-");
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "entry.ts"), "export {};\n", "utf8");

    const plan = buildNatesclawCompileCacheRespawnPlan({
      currentFile: path.join(root, "dist", "entry.js"),
      env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
      execArgv: ["--no-warnings"],
      execPath: "/usr/bin/node",
      installRoot: root,
      argv: ["/usr/bin/node", path.join(root, "dist", "entry.js"), "status", "--json"],
    });

    expect(plan).toEqual({
      command: "/usr/bin/node",
      args: ["--no-warnings", path.join(root, "dist", "entry.js"), "status", "--json"],
      env: {
        NODE_DISABLE_COMPILE_CACHE: "1",
        NATESCLAW_COMPILE_CACHE_DISABLED_RESPAWNED: "1",
      },
      detachForProcessTree: true,
    });
  });

  it("keeps POSIX native hook relays on the timeout-owned process", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-relay-");
    const entryFile = path.join(root, "src", "entry.ts");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export {};\n", "utf8");
    const params = {
      currentFile: entryFile,
      env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
      execPath: "/usr/bin/node",
      installRoot: root,
      argv: ["/usr/bin/node", entryFile, "hooks", "relay", "--relay-id", "relay-1"],
    };

    expect(
      buildNatesclawCompileCacheRespawnPlan({
        ...params,
        platform: "linux",
      }),
    ).toBeUndefined();
    expect(
      buildNatesclawCompileCacheRespawnPlan({
        ...params,
        platform: "win32",
      }),
    ).toBeDefined();
  });

  it("keeps interactive no-cache respawn plans attached to the terminal", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-interactive-");
    const entryFile = path.join(root, "dist", "entry.js");
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "entry.ts"), "export {};\n", "utf8");

    const plan = buildNatesclawCompileCacheRespawnPlan({
      currentFile: entryFile,
      env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
      execPath: "/usr/bin/node",
      installRoot: root,
      argv: ["/usr/bin/node", entryFile, "tui"],
    });

    expect(plan?.detachForProcessTree).toBe(false);
  });

  it("keeps bare-root no-cache respawn plans attached to the terminal", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-root-");
    const entryFile = path.join(root, "dist", "entry.js");
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "entry.ts"), "export {};\n", "utf8");

    const plan = buildNatesclawCompileCacheRespawnPlan({
      currentFile: entryFile,
      env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
      execPath: "/usr/bin/node",
      installRoot: root,
      argv: ["/usr/bin/node", entryFile],
    });

    expect(plan?.detachForProcessTree).toBe(false);
  });

  it("does not respawn unaffected packaged installs when NODE_COMPILE_CACHE is configured", () => {
    const root = tempDirs.make("natesclaw-compile-cache-package-respawn-");

    expect(
      buildNatesclawCompileCacheRespawnPlan({
        currentFile: path.join(root, "dist", "entry.js"),
        env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
        installRoot: root,
        nodeVersion: "24.1.0",
        platform: "linux",
      }),
    ).toBeUndefined();
  });

  it("builds a no-cache respawn plan for affected Windows packaged installs", () => {
    const root = tempDirs.make("natesclaw-compile-cache-package-win24-");
    const entryFile = path.join(root, "dist", "entry.js");

    const plan = buildNatesclawCompileCacheRespawnPlan({
      currentFile: entryFile,
      env: { NODE_COMPILE_CACHE: "/tmp/natesclaw-cache" },
      execArgv: ["--no-warnings"],
      execPath: "/usr/bin/node",
      installRoot: root,
      argv: ["/usr/bin/node", entryFile, "doctor", "--fix", "--non-interactive"],
      nodeVersion: "24.1.0",
      platform: "win32",
    });

    expect(plan).toEqual({
      command: "/usr/bin/node",
      args: ["--no-warnings", entryFile, "doctor", "--fix", "--non-interactive"],
      env: {
        NODE_DISABLE_COMPILE_CACHE: "1",
        NATESCLAW_COMPILE_CACHE_DISABLED_RESPAWNED: "1",
      },
      detachForProcessTree: false,
    });
  });

  it("does not respawn source checkouts twice", async () => {
    const root = tempDirs.make("natesclaw-compile-cache-respawn-once-");
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    await fs.writeFile(path.join(root, "src", "entry.ts"), "export {};\n", "utf8");

    expect(
      buildNatesclawCompileCacheRespawnPlan({
        currentFile: path.join(root, "dist", "entry.js"),
        env: {
          NODE_COMPILE_CACHE: "/tmp/natesclaw-cache",
          NATESCLAW_COMPILE_CACHE_DISABLED_RESPAWNED: "1",
        },
        installRoot: root,
      }),
    ).toBeUndefined();
  });

  it("runs compile-cache respawn plans with the child-process bridge", () => {
    const child = new EventEmitter() as ChildProcess;
    const spawn = vi.fn(() => child);
    const attachChildProcessBridge = vi.fn();
    const exit = vi.fn();
    const writeError = vi.fn();

    runNatesclawCompileCacheRespawnPlan(
      {
        command: "/usr/bin/node",
        args: ["/repo/natesclaw/dist/entry.js", "status"],
        env: { NODE_DISABLE_COMPILE_CACHE: "1" },
        detachForProcessTree: true,
      },
      {
        spawn: spawn as unknown as typeof import("node:child_process").spawn,
        attachChildProcessBridge,
        exit: exit as unknown as (code?: number) => never,
        writeError,
      },
    );

    expect(spawn).toHaveBeenCalledWith(
      "/usr/bin/node",
      ["/repo/natesclaw/dist/entry.js", "status"],
      {
        stdio: "inherit",
        env: { NODE_DISABLE_COMPILE_CACHE: "1" },
        detached: process.platform !== "win32" && !(process.stdin.isTTY || process.stdout.isTTY),
      },
    );
    const [bridgeChild, bridgeOptions] = requireFirstMockCall(
      attachChildProcessBridge,
      "child process bridge attach",
    );
    expect(bridgeChild).toBe(child);
    expect(bridgeOptions).toEqual({ onSignal: expect.any(Function) });

    child.emit("exit", 0, null);

    expect(exit).toHaveBeenCalledWith(0);
    expect(writeError).not.toHaveBeenCalled();
  });

  it("marks signal-terminated compile-cache respawn children as failed without forcing another exit", () => {
    const child = new EventEmitter() as ChildProcess;
    const spawn = vi.fn(() => child);
    const exit = vi.fn();

    runNatesclawCompileCacheRespawnPlan(
      {
        command: "/usr/bin/node",
        args: ["/repo/natesclaw/dist/entry.js"],
        env: {},
        detachForProcessTree: true,
      },
      {
        spawn: spawn as unknown as typeof import("node:child_process").spawn,
        attachChildProcessBridge: vi.fn(),
        exit: exit as unknown as (code?: number) => never,
        writeError: vi.fn(),
      },
    );

    child.emit("exit", null, "SIGTERM");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("waits for a signaled compile-cache respawn child after force-killing it", () => {
    vi.useFakeTimers();
    const child = new EventEmitter() as ChildProcess;
    const kill = vi.fn<(signal?: NodeJS.Signals) => boolean>(() => true);
    child.kill = kill as ChildProcess["kill"];
    const spawn = vi.fn(() => child);
    const exit = vi.fn();
    let onSignal: ((signal: NodeJS.Signals) => void) | undefined;

    try {
      runNatesclawCompileCacheRespawnPlan(
        {
          command: "/usr/bin/node",
          args: ["/repo/natesclaw/dist/entry.js"],
          env: {},
          detachForProcessTree: false,
        },
        {
          spawn: spawn as unknown as typeof import("node:child_process").spawn,
          attachChildProcessBridge: vi.fn((_child, options) => {
            onSignal = options?.onSignal;
            return { detach: vi.fn() };
          }),
          exit: exit as unknown as (code?: number) => never,
          writeError: vi.fn(),
        },
      );

      onSignal?.("SIGTERM");
      vi.advanceTimersByTime(1_000);

      expect(kill).toHaveBeenCalledWith("SIGTERM");
      expect(exit).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1_000);

      expect(kill).toHaveBeenCalledWith(process.platform === "win32" ? "SIGTERM" : "SIGKILL");
      expect(exit).not.toHaveBeenCalled();

      child.emit("exit", null, "SIGKILL");

      expect(exit).toHaveBeenCalledWith(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("disables compile cache for early Node 24.x versions on Windows", () => {
    const root = tempDirs.make("natesclaw-compile-cache-node24-");
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.1.0",
        platform: "win32",
      }),
    ).toBe(false);
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.14.0",
        platform: "win32",
      }),
    ).toBe(false);
  });

  it("keeps compile cache enabled for early Node 24.x on non-Windows packaged installs", () => {
    const root = tempDirs.make("natesclaw-compile-cache-node24-nonwin-");
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.1.0",
        platform: "linux",
      }),
    ).toBe(true);
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.14.0",
        platform: "darwin",
      }),
    ).toBe(true);
  });

  it("keeps compile cache enabled for Node 24.15+ and other majors on Windows", () => {
    const root = tempDirs.make("natesclaw-compile-cache-node2415-");
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "24.15.0",
        platform: "win32",
      }),
    ).toBe(true);
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "22.22.0",
        platform: "win32",
      }),
    ).toBe(true);
    expect(
      shouldEnableNatesclawCompileCache({
        env: {},
        installRoot: root,
        nodeVersion: "25.0.0",
        platform: "win32",
      }),
    ).toBe(true);
  });
});

describe("isNodeVersionAffectedByCompileCacheDeadlock", () => {
  it("flags Node 24.0 through 24.14 as affected", () => {
    expect(isNodeVersionAffectedByCompileCacheDeadlock("24.0.0")).toBe(true);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("24.1.0")).toBe(true);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("24.14.0")).toBe(true);
  });

  it("does not flag Node 24.15+", () => {
    expect(isNodeVersionAffectedByCompileCacheDeadlock("24.15.0")).toBe(false);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("24.20.1")).toBe(false);
  });

  it("does not flag other major versions", () => {
    expect(isNodeVersionAffectedByCompileCacheDeadlock("22.22.0")).toBe(false);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("23.11.0")).toBe(false);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("25.0.0")).toBe(false);
  });

  it("handles missing or invalid versions", () => {
    expect(isNodeVersionAffectedByCompileCacheDeadlock(undefined)).toBe(false);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("")).toBe(false);
    expect(isNodeVersionAffectedByCompileCacheDeadlock("not-a-version")).toBe(false);
  });
});
