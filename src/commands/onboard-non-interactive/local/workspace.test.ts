import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveNonInteractiveWorkspaceDir } from "./workspace.js";

describe("resolveNonInteractiveWorkspaceDir", () => {
  let root: string;

  beforeEach(async () => {
    const createdRoot = await fs.mkdtemp(path.join(os.tmpdir(), "natesclaw-onboard-workspace-"));
    root = await fs.realpath(createdRoot);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("keeps the existing default workspace for the default state directory", () => {
    const home = path.join(root, "home");
    const defaultWorkspaceDir = path.join(home, ".natesclaw", "workspace");
    const resolved = resolveNonInteractiveWorkspaceDir({
      opts: {},
      baseConfig: {},
      defaultWorkspaceDir,
      env: {
        HOME: home,
        NATESCLAW_HOME: home,
        NATESCLAW_STATE_DIR: path.join(home, ".natesclaw"),
      },
    });

    expect(resolved).toBe(defaultWorkspaceDir);
  });

  it("preserves NATESCLAW_WORKSPACE_DIR with a non-default state directory", () => {
    const home = path.join(root, "home");
    const workspaceOverride = path.join(root, "explicit-workspace");
    const resolved = resolveNonInteractiveWorkspaceDir({
      opts: {},
      baseConfig: {},
      defaultWorkspaceDir: path.join(home, ".natesclaw", "workspace"),
      env: {
        HOME: home,
        NATESCLAW_HOME: home,
        NATESCLAW_STATE_DIR: path.join(root, "scratch-state"),
        NATESCLAW_WORKSPACE_DIR: workspaceOverride,
      },
    });

    expect(resolved).toBe(workspaceOverride);
  });

  it("ignores a blank NATESCLAW_WORKSPACE_DIR", () => {
    const home = path.join(root, "home");
    const stateDir = path.join(root, "scratch-state");
    const resolved = resolveNonInteractiveWorkspaceDir({
      opts: {},
      baseConfig: {},
      defaultWorkspaceDir: path.join(home, ".natesclaw", "workspace"),
      env: {
        HOME: home,
        NATESCLAW_HOME: home,
        NATESCLAW_STATE_DIR: stateDir,
        NATESCLAW_WORKSPACE_DIR: "   ",
      },
    });

    expect(resolved).toBe(path.join(stateDir, "workspace"));
  });

  it("ignores blank CLI and configured workspace values", () => {
    const home = path.join(root, "home");
    const stateDir = path.join(root, "scratch-state");
    const resolved = resolveNonInteractiveWorkspaceDir({
      opts: { workspace: "   " },
      baseConfig: { agents: { defaults: { workspace: "\t" } } },
      defaultWorkspaceDir: path.join(home, ".natesclaw", "workspace"),
      env: {
        HOME: home,
        NATESCLAW_HOME: home,
        NATESCLAW_STATE_DIR: stateDir,
      },
    });

    expect(resolved).toBe(path.join(stateDir, "workspace"));
  });
});
