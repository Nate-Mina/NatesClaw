// Workspace default tests cover environment-variable precedence for the
// built-in agent workspace location.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withEnv } from "../test-utils/env.js";
import { resolveDefaultAgentWorkspaceDir } from "./workspace.js";

describe("DEFAULT_AGENT_WORKSPACE_DIR", () => {
  it("uses NATESCLAW_HOME when resolving the default workspace dir", () => {
    const home = path.join(path.sep, "srv", "natesclaw-home");

    const resolved = withEnv(
      {
        NATESCLAW_WORKSPACE_DIR: undefined,
        NATESCLAW_PROFILE: undefined,
        NATESCLAW_HOME: home,
        HOME: path.join(path.sep, "home", "other"),
      },
      () => resolveDefaultAgentWorkspaceDir(),
    );

    expect(resolved).toBe(path.join(path.resolve(home), ".natesclaw", "workspace"));
  });

  it("uses NATESCLAW_WORKSPACE_DIR before NATESCLAW_HOME", () => {
    const workspaceDir = path.join(path.sep, "srv", "natesclaw-workspace");

    const resolved = withEnv(
      {
        NATESCLAW_WORKSPACE_DIR: workspaceDir,
        NATESCLAW_HOME: path.join(path.sep, "srv", "natesclaw-home"),
      },
      () => resolveDefaultAgentWorkspaceDir(),
    );

    expect(resolved).toBe(path.resolve(workspaceDir));
  });
});
