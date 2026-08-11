// Tests Natesclaw execution environment construction.
import { describe, expect, it } from "vitest";
import { deleteTestEnvValue, setTestEnvValue } from "../test-utils/env.js";
import {
  ensureNatesclawExecMarkerOnProcess,
  markNatesclawExecEnv,
  NATESCLAW_CLI_ENV_VAR,
} from "./natesclaw-exec-env.js";

const NATESCLAW_CLI_ENV_VALUE = "1";

describe("markNatesclawExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", NATESCLAW_CLI: "0" };
    const marked = markNatesclawExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      NATESCLAW_CLI: NATESCLAW_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.NATESCLAW_CLI).toBe("0");
  });
});

describe("ensureNatesclawExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [NATESCLAW_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureNatesclawExecMarkerOnProcess(env)).toBe(env);
    expect(env[NATESCLAW_CLI_ENV_VAR]).toBe(NATESCLAW_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[NATESCLAW_CLI_ENV_VAR];
    deleteTestEnvValue(NATESCLAW_CLI_ENV_VAR);

    try {
      expect(ensureNatesclawExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[NATESCLAW_CLI_ENV_VAR]).toBe(NATESCLAW_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        deleteTestEnvValue(NATESCLAW_CLI_ENV_VAR);
      } else {
        setTestEnvValue(NATESCLAW_CLI_ENV_VAR, previous);
      }
    }
  });
});
