// Delivery queue helper tests cover shared SQLite and temp-directory cleanup.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isNatesclawStateDatabaseOpen,
  openNatesclawStateDatabase,
} from "../../state/natesclaw-state-db.js";
import { installDeliveryQueueTmpDirHooks } from "./delivery-queue.test-helpers.js";

const fixture = installDeliveryQueueTmpDirHooks();
let previousTmpDir = "";

describe("installDeliveryQueueTmpDirHooks", () => {
  it("tracks an open per-case state database", () => {
    previousTmpDir = fixture.tmpDir();
    openNatesclawStateDatabase({ env: { ...process.env, NATESCLAW_STATE_DIR: previousTmpDir } });

    expect(isNatesclawStateDatabaseOpen()).toBe(true);
    expect(fs.existsSync(previousTmpDir)).toBe(true);
  });

  it("closes handles and removes the previous case directory", () => {
    expect(isNatesclawStateDatabaseOpen()).toBe(false);
    expect(fs.existsSync(previousTmpDir)).toBe(false);
  });
});
