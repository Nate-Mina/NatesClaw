// Verifies chat-facing CLI snippets execute the Natesclaw CLI even from harness-hosted gateways.
import { describe, expect, it } from "vitest";
import {
  buildCurrentNatesclawCliArgv,
  buildCurrentNatesclawCliCommand,
  buildCurrentNatesclawCliExecEnv,
} from "./commands-natesclaw-cli.js";

describe("buildCurrentNatesclawCliArgv", () => {
  it("delegates launch policy while keeping shell rendering local", () => {
    const args = ["sessions", "export-trajectory"];
    const argv = buildCurrentNatesclawCliArgv(args);
    expect(argv.at(-2)).toBe("sessions");
    expect(argv.at(-1)).toBe("export-trajectory");
    expect(buildCurrentNatesclawCliCommand(args)).toBe(argv.map((value) => `'${value}'`).join(" "));
  });

  it("clears inherited Vitest runner environment for CLI child processes", () => {
    expect(
      buildCurrentNatesclawCliExecEnv({
        PATH: "/usr/bin",
        VITEST: "true",
        VITEST_POOL_ID: "pool",
        NATESCLAW_VITEST_MAX_WORKERS: "1",
      }),
    ).toEqual({
      VITEST: "",
      VITEST_POOL_ID: "",
      NATESCLAW_VITEST_MAX_WORKERS: "",
    });
  });
});
