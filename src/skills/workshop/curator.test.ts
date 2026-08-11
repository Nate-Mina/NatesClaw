import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeNatesclawStateDatabaseForTest,
  openNatesclawStateDatabase,
} from "../../state/natesclaw-state-db.js";
import {
  createNatesclawTestState,
  type NatesclawTestState,
} from "../../test-utils/natesclaw-test-state.js";
import {
  clearCuratedSkillLifecycle,
  getArchivedSkillFiles,
  getSkillCuratorStatus,
  pinCuratedSkill,
  restoreCuratedSkill,
  unpinCuratedSkill,
} from "./curator.js";

let testState: NatesclawTestState;

beforeEach(async () => {
  testState = await createNatesclawTestState({
    layout: "state-only",
    prefix: "natesclaw-legacy-skill-curator-",
  });
});

afterEach(async () => {
  closeNatesclawStateDatabaseForTest();
  await testState.cleanup();
});

describe("legacy skill curator state", () => {
  it("keeps shipped status controls while collection review clears their state", () => {
    const skillFile = "/workspace/skills/daily-brief/SKILL.md";
    const database = openNatesclawStateDatabase({ env: testState.env });
    database.db
      .prepare(
        `INSERT INTO skill_lifecycle (
          skill_file, skill_key, skill_name, state, pinned,
          state_changed_at_ms, created_at_ms, archived_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(skillFile, "daily-brief", "Daily Brief", "archived", 0, 10, 1, "unused");

    expect(getArchivedSkillFiles({ env: testState.env })).toEqual(new Set([skillFile]));
    expect(pinCuratedSkill("daily-brief", { env: testState.env }).pinned).toBe(true);
    expect(unpinCuratedSkill("daily-brief", { env: testState.env }).pinned).toBe(false);
    expect(restoreCuratedSkill("daily-brief", { env: testState.env, nowMs: 20 }).state).toBe(
      "active",
    );

    clearCuratedSkillLifecycle([skillFile], { env: testState.env });
    expect(getSkillCuratorStatus({ env: testState.env }).skills).toEqual([]);
  });
});
