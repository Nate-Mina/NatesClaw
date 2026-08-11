// Tests isolated Natesclaw test-state setup and cleanup behavior.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it, vi } from "vitest";
import { loadPersistedAuthProfileStore } from "../agents/auth-profiles/persisted.js";
import {
  closeAuthProfileReadPool,
  resolveAuthProfileDatabasePath,
} from "../agents/auth-profiles/sqlite.js";
import { saveAuthProfileStore } from "../agents/auth-profiles/store.js";
import {
  GATEWAY_STARTUP_MUTATED_ENV_KEYS,
  snapshotGatewayStartupEnv,
} from "../gateway/test-helpers.env.js";
import * as nodeSqlite from "../infra/node-sqlite.js";
import {
  closeNatesclawAgentDatabaseByPath,
  openNatesclawAgentDatabase,
} from "../state/natesclaw-agent-db.js";
import {
  closeNatesclawStateDatabaseByPath,
  openNatesclawStateDatabase,
} from "../state/natesclaw-state-db.js";
import { setTestEnvValue, withEnvAsync } from "./env.js";
import { createNatesclawTestState, withNatesclawTestState } from "./natesclaw-test-state.js";

async function expectPathMissing(targetPath: string): Promise<void> {
  try {
    await fs.stat(targetPath);
  } catch (error) {
    expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
    return;
  }
  throw new Error(`expected missing path: ${targetPath}`);
}

describe("natesclaw test state", () => {
  it("creates an isolated home layout with spawn env and restores process env", async () => {
    const previousHome = process.env.HOME;
    const previousNatesclawHome = process.env.NATESCLAW_HOME;
    const previousStateDir = process.env.NATESCLAW_STATE_DIR;
    const previousConfigPath = process.env.NATESCLAW_CONFIG_PATH;
    const previousGatewayStartupEnv = snapshotGatewayStartupEnv();

    const state = await createNatesclawTestState({
      label: "unit",
      scenario: "minimal",
    });

    try {
      expect(state.home).toBe(path.join(state.root, "home"));
      expect(state.stateDir).toBe(path.join(state.home, ".natesclaw"));
      expect(state.configPath).toBe(path.join(state.stateDir, "natesclaw.json"));
      expect(state.workspaceDir).toBe(path.join(state.home, "workspace"));
      expect(state.env.HOME).toBe(state.home);
      expect(state.env.NATESCLAW_HOME).toBe(state.home);
      expect(state.env.NATESCLAW_STATE_DIR).toBe(state.stateDir);
      expect(state.env.NATESCLAW_CONFIG_PATH).toBe(state.configPath);
      expect(process.env.HOME).toBe(state.home);
      expect(process.env.NATESCLAW_HOME).toBe(state.home);
      expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toStrictEqual({});
      for (const key of GATEWAY_STARTUP_MUTATED_ENV_KEYS) {
        setTestEnvValue(key, `mutated-${key}`);
      }
    } finally {
      await state.cleanup();
    }

    expect(process.env.HOME).toBe(previousHome);
    expect(process.env.NATESCLAW_HOME).toBe(previousNatesclawHome);
    expect(process.env.NATESCLAW_STATE_DIR).toBe(previousStateDir);
    expect(process.env.NATESCLAW_CONFIG_PATH).toBe(previousConfigPath);
    expect(snapshotGatewayStartupEnv()).toEqual(previousGatewayStartupEnv);
    await expectPathMissing(state.root);
  });

  it("supports state-only layout without overriding HOME", async () => {
    const previousHome = process.env.HOME;

    await withNatesclawTestState(
      {
        layout: "state-only",
        scenario: "empty",
      },
      async (state) => {
        expect(process.env.HOME).toBe(previousHome);
        expect(process.env.NATESCLAW_STATE_DIR).toBe(state.stateDir);
        expect(process.env.NATESCLAW_CONFIG_PATH).toBe(state.configPath);
        expect(state.env.HOME).toBe(previousHome);
        await expectPathMissing(state.configPath);
      },
    );
  });

  it("clears inherited agent-dir overrides by default", async () => {
    await withEnvAsync({ NATESCLAW_AGENT_DIR: "/tmp/outside-natesclaw-agent" }, async () => {
      const state = await createNatesclawTestState({
        layout: "state-only",
      });

      try {
        expect(process.env.NATESCLAW_AGENT_DIR).toBeUndefined();
        expect(state.env.NATESCLAW_AGENT_DIR).toBeUndefined();
        expect(state.agentDir()).toBe(path.join(state.stateDir, "agents", "main", "agent"));
      } finally {
        await state.cleanup();
      }

      expect(process.env.NATESCLAW_AGENT_DIR).toBe("/tmp/outside-natesclaw-agent");
    });
  });

  it("allows explicit agent-dir overrides when a test needs them", async () => {
    await withNatesclawTestState(
      {
        env: {
          NATESCLAW_AGENT_DIR: "/tmp/explicit-natesclaw-agent",
        },
      },
      async (state) => {
        expect(process.env.NATESCLAW_AGENT_DIR).toBe("/tmp/explicit-natesclaw-agent");
        expect(state.env.NATESCLAW_AGENT_DIR).toBe("/tmp/explicit-natesclaw-agent");
      },
    );
  });

  it("can route agent-dir env vars to the isolated main agent store", async () => {
    await withNatesclawTestState(
      {
        agentEnv: "main",
      },
      async (state) => {
        expect(process.env.NATESCLAW_AGENT_DIR).toBe(state.agentDir());
        expect(state.env.NATESCLAW_AGENT_DIR).toBe(state.agentDir());
      },
    );
  });

  it("writes scenario configs and auth profile stores", async () => {
    await withNatesclawTestState(
      {
        scenario: "update-stable",
      },
      async (state) => {
        expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toEqual({
          update: {
            channel: "stable",
          },
          plugins: {},
        });

        const profilePath = await state.writeAuthProfiles({
          version: 1,
          profiles: {
            "openai:test": {
              type: "api_key",
              provider: "openai",
              key: "sk-test",
            },
          },
        });

        expect(profilePath).toBe(path.join(state.agentDir(), "natesclaw-agent.sqlite"));
        const profiles = loadPersistedAuthProfileStore(state.agentDir());
        expect(profiles?.version).toBe(1);
        expect(profiles?.profiles["openai:test"]?.provider).toBe("openai");
      },
    );
  });

  it("closes only fixture-owned databases before restoring env", async () => {
    const previousStateDir = process.env.NATESCLAW_STATE_DIR;
    const unrelatedRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "natesclaw-test-state-unrelated-"),
    );
    const unrelatedEnv = {
      ...process.env,
      NATESCLAW_STATE_DIR: path.join(unrelatedRoot, "state"),
    };
    const state = await createNatesclawTestState({
      layout: "state-only",
      label: "database-cleanup",
    });
    const authStore = {
      version: 1,
      profiles: {
        "openai:test": {
          type: "api_key" as const,
          provider: "openai",
          key: "sk-test",
        },
      },
    };
    const fixtureAuthDir = state.agentDir("auth-reader");
    const fixtureAuthPath = resolveAuthProfileDatabasePath(fixtureAuthDir);
    saveAuthProfileStore(authStore, fixtureAuthDir, {
      filterExternalAuthProfiles: false,
      syncExternalCli: false,
    });
    const unrelatedAgentDir = path.join(unrelatedRoot, "state", "agents", "outside", "agent");
    saveAuthProfileStore(authStore, unrelatedAgentDir, {
      filterExternalAuthProfiles: false,
      syncExternalCli: false,
    });
    const fixtureShared = openNatesclawStateDatabase({ env: state.env });
    const fixtureAgent = openNatesclawAgentDatabase({
      agentId: "worker",
      env: state.env,
    });
    const unrelatedShared = openNatesclawStateDatabase({ env: unrelatedEnv });
    const unrelatedAgent = openNatesclawAgentDatabase({
      agentId: "outside",
      env: unrelatedEnv,
    });
    const openSpy = vi.spyOn(nodeSqlite, "openNodeSqliteDatabase");
    expect(loadPersistedAuthProfileStore(state.agentDir("auth-reader"))).not.toBeNull();
    expect(loadPersistedAuthProfileStore(unrelatedAgentDir)).not.toBeNull();
    const readOnlyDatabases = openSpy.mock.calls.flatMap((call, index) => {
      if (call[1]?.readOnly !== true) {
        return [];
      }
      const database = openSpy.mock.results[index]?.value as DatabaseSync | undefined;
      return database ? [{ path: path.resolve(call[0]), database }] : [];
    });
    const fixtureAuthReader = readOnlyDatabases.find(
      (entry) => entry.path === path.resolve(fixtureAuthPath),
    )?.database;
    const unrelatedAuthReader = readOnlyDatabases.find(
      (entry) => entry.path === path.resolve(unrelatedAgent.path),
    )?.database;
    if (!fixtureAuthReader || !unrelatedAuthReader) {
      throw new Error("expected fixture and unrelated pooled auth readers");
    }
    expect(fixtureAuthReader.isOpen).toBe(true);
    expect(unrelatedAuthReader.isOpen).toBe(true);
    const restoreEnv = state.restoreEnv;
    const originalRm = fs.rm;
    const rmSpy = vi.spyOn(fs, "rm").mockImplementation((...args) => {
      expect(fixtureAuthReader.isOpen).toBe(false);
      expect(unrelatedAuthReader.isOpen).toBe(true);
      return originalRm(...args);
    });
    state.restoreEnv = () => {
      expect(process.env.NATESCLAW_STATE_DIR).toBe(state.stateDir);
      expect(fixtureAuthReader.isOpen).toBe(false);
      expect(fixtureShared.db.isOpen).toBe(false);
      expect(fixtureAgent.db.isOpen).toBe(false);
      expect(unrelatedAuthReader.isOpen).toBe(true);
      expect(unrelatedShared.db.isOpen).toBe(true);
      expect(unrelatedAgent.db.isOpen).toBe(true);
      restoreEnv();
    };

    try {
      await state.cleanup();

      expect(process.env.NATESCLAW_STATE_DIR).toBe(previousStateDir);
      expect(rmSpy).toHaveBeenCalledWith(state.root, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 25,
      });
      await expectPathMissing(state.root);
      expect(unrelatedAuthReader.isOpen).toBe(true);
      expect(unrelatedShared.db.isOpen).toBe(true);
      expect(unrelatedAgent.db.isOpen).toBe(true);
    } finally {
      state.restoreEnv = restoreEnv;
      restoreEnv();
      closeAuthProfileReadPool({ kind: "database", databasePath: fixtureAuthPath });
      closeAuthProfileReadPool({ kind: "database", databasePath: unrelatedAgent.path });
      closeNatesclawAgentDatabaseByPath(fixtureAgent.path);
      closeNatesclawAgentDatabaseByPath(unrelatedAgent.path);
      closeNatesclawStateDatabaseByPath(fixtureShared.path);
      closeNatesclawStateDatabaseByPath(unrelatedShared.path);
      openSpy.mockRestore();
      rmSpy.mockRestore();
      await fs.rm(state.root, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 25,
      });
      await fs.rm(unrelatedRoot, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 25,
      });
    }
  });

  it("preserves callback failures after closing fixture databases", async () => {
    const callbackError = new Error("fixture callback failed");
    let root = "";
    let shared: ReturnType<typeof openNatesclawStateDatabase> | undefined;
    let agent: ReturnType<typeof openNatesclawAgentDatabase> | undefined;

    await expect(
      withNatesclawTestState({ layout: "state-only", label: "callback-failure" }, async (state) => {
        root = state.root;
        shared = openNatesclawStateDatabase({ env: state.env });
        agent = openNatesclawAgentDatabase({
          agentId: "main",
          env: state.env,
        });
        throw callbackError;
      }),
    ).rejects.toBe(callbackError);

    expect(shared?.db.isOpen).toBe(false);
    expect(agent?.db.isOpen).toBe(false);
    await expectPathMissing(root);
  });

  it("creates upgrade survivor fixture state", async () => {
    await withNatesclawTestState(
      {
        scenario: "upgrade-survivor",
      },
      async (state) => {
        const config = JSON.parse(await fs.readFile(state.configPath, "utf8"));
        expect(config.update?.channel).toBe("stable");
        expect(config.plugins?.enabled).toBe(true);
        expect(config.plugins?.allow).toStrictEqual(["discord", "telegram", "whatsapp", "memory"]);
      },
    );
  });

  it("keeps external-service env scoped to the fixture", async () => {
    const previousPolicy = process.env.NATESCLAW_SERVICE_REPAIR_POLICY;

    await withNatesclawTestState(
      {
        scenario: "external-service",
      },
      async (state) => {
        expect(process.env.NATESCLAW_SERVICE_REPAIR_POLICY).toBe("external");
        expect(state.env.NATESCLAW_SERVICE_REPAIR_POLICY).toBe("external");
      },
    );

    expect(process.env.NATESCLAW_SERVICE_REPAIR_POLICY).toBe(previousPolicy);
  });
});
