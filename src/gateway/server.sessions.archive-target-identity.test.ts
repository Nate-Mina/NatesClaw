// Archive and restore mutate existing session generations; metadata patches may still create.
import { afterEach, expect, test } from "vitest";
import { loadSessionEntry } from "../config/sessions/session-accessor.js";
import { applySqliteSessionEntryCanonicalReplacements } from "../config/sessions/session-accessor.sqlite-replacement-projection.js";
import { createDeferred } from "../shared/deferred.js";
import { closeOpenClawStateDatabaseForTest } from "../state/openclaw-state-db.js";
import { writeSessionStore } from "./test-helpers.js";
import {
  directSessionReq,
  expectNoSessionQueueCleanup,
  sessionStoreEntry,
  setupGatewaySessionsHandlerTestHarness,
} from "./test/server-sessions.test-helpers.js";

const { createSessionStoreDir } = setupGatewaySessionsHandlerTestHarness();

afterEach(() => {
  closeOpenClawStateDatabaseForTest();
});

test.each([
  { action: "archive", archived: true },
  { action: "restore", archived: false },
])(
  "sessions.patch rejects missing $action targets without creating SQLite rows",
  async ({ archived }) => {
    const { storePath } = await createSessionStoreDir();
    const sessionKey = "agent:main:missing-lifecycle-target";
    await writeSessionStore({ entries: {} });

    const result = await directSessionReq("sessions.patch", { key: sessionKey, archived });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "INVALID_REQUEST", message: `session not found: ${sessionKey}` },
    });
    expect(loadSessionEntry({ storePath, sessionKey })).toBeUndefined();
    expectNoSessionQueueCleanup();
  },
);

test("sessions.patch still creates missing sessions for metadata-only updates", async () => {
  const { storePath } = await createSessionStoreDir();
  const sessionKey = "agent:main:new-metadata-session";
  await writeSessionStore({ entries: {} });

  const result = await directSessionReq("sessions.patch", {
    key: sessionKey,
    label: "New session",
  });

  expect(result.ok).toBe(true);
  expect(loadSessionEntry({ storePath, sessionKey })).toMatchObject({
    label: "New session",
    sessionId: expect.any(String),
  });
});

test.each([
  { action: "archive", archived: true },
  { action: "restore", archived: false },
])(
  "sessions.patchMany isolates missing $action targets without creating SQLite rows",
  async ({ archived }) => {
    const { storePath } = await createSessionStoreDir();
    const existingKeys = ["agent:main:lifecycle-before", "agent:main:lifecycle-after"];
    const missingKey = "agent:main:missing-lifecycle-target";
    await writeSessionStore({
      entries: Object.fromEntries(
        existingKeys.map((sessionKey, index) => [
          sessionKey,
          sessionStoreEntry(`existing-session-${index}`, archived ? {} : { archivedAt: 1 }),
        ]),
      ),
    });

    const result = await directSessionReq<{
      outcomes: Array<{ error?: { code: string; message: string }; key: string; ok: boolean }>;
    }>("sessions.patchMany", {
      targets: [{ key: existingKeys[0]! }, { key: missingKey }, { key: existingKeys[1]! }],
      patch: { archived },
    });

    expect(result.ok).toBe(true);
    expect(result.payload?.outcomes).toEqual([
      { key: existingKeys[0], ok: true },
      {
        key: missingKey,
        ok: false,
        error: { code: "INVALID_REQUEST", message: `session not found: ${missingKey}` },
      },
      { key: existingKeys[1], ok: true },
    ]);
    expect(loadSessionEntry({ storePath, sessionKey: missingKey })).toBeUndefined();
    for (const sessionKey of existingKeys) {
      const entry = loadSessionEntry({ storePath, sessionKey });
      if (archived) {
        expect(entry?.archivedAt).toEqual(expect.any(Number));
      } else {
        expect(entry?.archivedAt).toBeUndefined();
      }
    }
  },
);

test.each([
  {
    identity: "session id",
    replacementSessionId: "restored-replacement",
    replacementLifecycleRevision: "revision-before-restore",
  },
  {
    identity: "lifecycle revision",
    replacementSessionId: "restored-original",
    replacementLifecycleRevision: "revision-after-restore",
  },
])(
  "sessions.patch rejects a $identity replaced before restore reaches the SQLite writer",
  async ({ replacementLifecycleRevision, replacementSessionId }) => {
    const { storePath } = await createSessionStoreDir();
    const sessionKey = "agent:main:restore-generation-race";
    const originalSessionId = "restored-original";
    await writeSessionStore({
      entries: {
        [sessionKey]: sessionStoreEntry(originalSessionId, {
          archivedAt: 1,
          lifecycleRevision: "revision-before-restore",
        }),
      },
    });

    const writerStarted = createDeferred();
    const replaceSession = createDeferred();
    const writer = applySqliteSessionEntryCanonicalReplacements({
      agentId: "main",
      sessionKeys: [sessionKey],
      storePath,
      update: async () => {
        writerStarted.resolve();
        await replaceSession.promise;
        return {
          replacements: [
            {
              entry: sessionStoreEntry(replacementSessionId, {
                archivedAt: 2,
                lifecycleRevision: replacementLifecycleRevision,
              }),
              previousSessionKeys: [],
              sessionKey,
            },
          ],
          result: undefined,
        };
      },
    });
    await writerStarted.promise;

    const preflightCompleted = createDeferred();
    const restored = directSessionReq(
      "sessions.patch",
      { key: sessionKey, archived: false },
      {
        context: {
          workerSessionPlacementService: {
            getMany(sessionIds: readonly string[]) {
              if (sessionIds.includes(originalSessionId)) {
                preflightCompleted.resolve();
              }
              return new Map();
            },
          },
        },
      },
    );

    try {
      await preflightCompleted.promise;
      replaceSession.resolve();
      await writer;

      expect(await restored).toMatchObject({
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message: `Session ${sessionKey} changed before patch. Retry.`,
        },
      });
      expect(loadSessionEntry({ storePath, sessionKey })).toMatchObject({
        archivedAt: 2,
        lifecycleRevision: replacementLifecycleRevision,
        sessionId: replacementSessionId,
      });
    } finally {
      replaceSession.resolve();
      await Promise.allSettled([writer, restored]);
    }
  },
);
