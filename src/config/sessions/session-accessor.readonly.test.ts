import fs from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTempDirs, makeTempDir } from "../../../test/helpers/temp-dir.js";
import {
  closeNatesclawAgentDatabasesForTest,
  isNatesclawAgentDatabaseOpen,
  openNatesclawAgentDatabase,
  resolveNatesclawAgentSqlitePath,
} from "../../state/natesclaw-agent-db.js";
import {
  closeNatesclawStateDatabaseForTest,
  openNatesclawStateDatabase,
} from "../../state/natesclaw-state-db.js";
import {
  hasSessionEntriesByStatusReadOnly,
  listSessionEntriesCore,
  listSessionEntriesReadOnly,
  resolveTranscriptSessionKeyBySessionId,
  upsertSessionEntryCore,
} from "./session-accessor.js";

const tempDirs: string[] = [];

function countRegisteredAgentDatabases(env: NodeJS.ProcessEnv): number {
  const row = openNatesclawStateDatabase({ env })
    .db.prepare("SELECT count(*) AS count FROM agent_databases")
    .get() as { count: number };
  return row.count;
}

function clearRegisteredAgentDatabases(env: NodeJS.ProcessEnv): void {
  openNatesclawStateDatabase({ env }).db.prepare("DELETE FROM agent_databases").run();
}

afterEach(() => {
  closeNatesclawAgentDatabasesForTest();
  closeNatesclawStateDatabaseForTest();
  cleanupTempDirs(tempDirs);
});

describe("session accessor readonly listing", () => {
  it("returns the same entries as the writable listing for a populated agent database", async () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-populated-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const listScope = { agentId: "worker-1", env };

    await upsertSessionEntryCore(
      { ...listScope, sessionKey: "agent:worker-1:main" },
      { sessionId: "session-1", updatedAt: 10 },
    );
    await upsertSessionEntryCore(
      { ...listScope, sessionKey: "agent:worker-1:telegram:dm:42" },
      { sessionId: "session-2", updatedAt: 20 },
    );
    const writableEntries = listSessionEntriesCore(listScope);
    closeNatesclawAgentDatabasesForTest();

    expect(listSessionEntriesReadOnly(listScope)).toEqual(writableEntries);
  });

  it("returns an empty list without creating or registering a missing agent database", () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-missing-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const databasePath = resolveNatesclawAgentSqlitePath({ agentId, env });
    clearRegisteredAgentDatabases(env);

    expect(listSessionEntriesReadOnly({ agentId, env })).toEqual([]);
    expect(fs.existsSync(databasePath)).toBe(false);
    expect(countRegisteredAgentDatabases(env)).toBe(0);
  });

  it("probes lifecycle status without creating or registering a missing database", () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-status-missing-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const databasePath = resolveNatesclawAgentSqlitePath({ agentId, env });
    clearRegisteredAgentDatabases(env);

    expect(hasSessionEntriesByStatusReadOnly({ agentId, env }, ["running"])).toBe(false);
    expect(fs.existsSync(databasePath)).toBe(false);
    expect(countRegisteredAgentDatabases(env)).toBe(0);
  });

  it("distinguishes non-session agent state from a running session row", async () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-status-existing-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const databasePath = resolveNatesclawAgentSqlitePath({ agentId, env });
    openNatesclawAgentDatabase({ agentId, env, path: databasePath });
    closeNatesclawAgentDatabasesForTest();
    clearRegisteredAgentDatabases(env);

    expect(hasSessionEntriesByStatusReadOnly({ agentId, env }, ["running"])).toBe(false);
    expect(countRegisteredAgentDatabases(env)).toBe(0);

    await upsertSessionEntryCore(
      { agentId, env, sessionKey: "agent:worker-1:main" },
      { sessionId: "session-1", status: "running", updatedAt: 10 },
    );
    closeNatesclawAgentDatabasesForTest();
    clearRegisteredAgentDatabases(env);

    expect(hasSessionEntriesByStatusReadOnly({ agentId, env }, ["running"])).toBe(true);
    expect(hasSessionEntriesByStatusReadOnly({ agentId, env }, ["done"])).toBe(false);
    expect(countRegisteredAgentDatabases(env)).toBe(0);
  });

  it("resolves a missing session identity without creating or registering a database", () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-missing-identity-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const databasePath = resolveNatesclawAgentSqlitePath({ agentId, env });
    clearRegisteredAgentDatabases(env);

    expect(
      resolveTranscriptSessionKeyBySessionId({ agentId, env, sessionId: "missing-session" }),
    ).toBeUndefined();
    expect(fs.existsSync(databasePath)).toBe(false);
    expect(countRegisteredAgentDatabases(env)).toBe(0);
  });

  it("resolves an existing session identity without registering its database", async () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-existing-identity-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const sessionKey = "agent:worker-1:main";
    await upsertSessionEntryCore(
      { agentId, env, sessionKey },
      { sessionId: "session-1", updatedAt: 1 },
    );
    closeNatesclawAgentDatabasesForTest();
    clearRegisteredAgentDatabases(env);

    expect(resolveTranscriptSessionKeyBySessionId({ agentId, env, sessionId: "session-1" })).toBe(
      sessionKey,
    );
    expect(countRegisteredAgentDatabases(env)).toBe(0);
  });

  it("does not register a populated database during readonly health-style listing", async () => {
    const stateDir = makeTempDir(tempDirs, "natesclaw-session-readonly-registry-");
    const env = { NATESCLAW_STATE_DIR: stateDir };
    const agentId = "worker-1";
    const scope = { agentId, env };

    await upsertSessionEntryCore(
      { ...scope, sessionKey: "agent:worker-1:main" },
      { sessionId: "session-1", updatedAt: 10 },
    );
    const databasePath = resolveNatesclawAgentSqlitePath({ agentId, env });
    closeNatesclawAgentDatabasesForTest();
    clearRegisteredAgentDatabases(env);

    expect(listSessionEntriesReadOnly(scope)).toHaveLength(1);
    expect(countRegisteredAgentDatabases(env)).toBe(0);
    expect(isNatesclawAgentDatabaseOpen(databasePath)).toBe(false);
  });
});
