import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closeNatesclawStateDatabaseForTest } from "../state/natesclaw-state-db.js";
import { readHookInstalls, recordHookInstall } from "./installs.js";

afterEach(() => {
  closeNatesclawStateDatabaseForTest();
});

describe("hook install machine state", () => {
  it("merges independently recorded hook packs", () => {
    const stateDir = mkdtempSync(join(tmpdir(), "natesclaw-hook-installs-"));
    const options = { env: { ...process.env, NATESCLAW_STATE_DIR: stateDir } };

    recordHookInstall({}, { hookId: "alpha", source: "npm" }, options);
    recordHookInstall({}, { hookId: "beta", source: "path" }, options);

    expect(readHookInstalls(options)).toMatchObject({
      alpha: { source: "npm" },
      beta: { source: "path" },
    });
  });
});
