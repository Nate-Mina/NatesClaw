import path from "node:path";
import {
  clearNodeSqliteKyselyCacheForDatabase,
  registerNodeSqliteKyselyQueryErrorHandler,
} from "../infra/kysely-sync.js";
import type { SqliteFileGeneration } from "../infra/sqlite-file-generation.js";
import { createSqliteTerminalOpenLatch } from "../infra/sqlite-terminal-open-latch.js";
import { isSqliteCorruptionError } from "../infra/sqlite-transaction.js";
import { readNatesclawDatabaseQuarantine } from "./natesclaw-quarantine-store.js";
import type { NatesclawStateDatabase } from "./natesclaw-state-db-contract.js";
import { createNatesclawDatabaseVerificationError } from "./natesclaw-state-db-maintenance.js";

const cachedDatabases = new Map<string, NatesclawStateDatabase>();

type NatesclawStateDatabaseCloseResult = {
  caught: boolean;
  errors: unknown[];
};

/** Close both physical-handle owners while retaining every cleanup failure. */
function closeNatesclawStateDatabaseHandle(
  database: NatesclawStateDatabase,
): NatesclawStateDatabaseCloseResult {
  let caught = false;
  const errors: unknown[] = [];
  try {
    database.walMaintenance.close();
  } catch (error) {
    caught = true;
    errors.push(error);
  }
  clearNodeSqliteKyselyCacheForDatabase(database.db);
  try {
    if (database.db.isOpen) {
      database.db.close();
    }
  } catch (error) {
    caught = true;
    errors.push(error);
  }
  return { caught, errors };
}

function evictCachedNatesclawStateDatabase(database: NatesclawStateDatabase): boolean {
  if (cachedDatabases.get(database.path) !== database) {
    return false;
  }
  // Remove ownership before cleanup. A poisoned native handle can reject close,
  // but it must never remain discoverable as the process-wide shared handle.
  cachedDatabases.delete(database.path);
  // Eviction is best-effort; the triggering database error remains authoritative.
  closeNatesclawStateDatabaseHandle(database);
  return true;
}

/** Evict an exact cached shared-state owner after a proven corruption read. */
function evictNatesclawStateDatabaseAfterCorruption(
  database: NatesclawStateDatabase,
  error: unknown,
): boolean {
  return isSqliteCorruptionError(error) && evictCachedNatesclawStateDatabase(database);
}

const terminalOpenLatch = createSqliteTerminalOpenLatch({
  closeByPath: (pathname) => {
    const cached = cachedDatabases.get(pathname);
    if (cached) {
      evictCachedNatesclawStateDatabase(cached);
    }
  },
});

/** Publish a fully opened handle and bind query corruption to its exact cache owner. */
function publishNatesclawStateDatabase(database: NatesclawStateDatabase): NatesclawStateDatabase {
  const { db, path: pathname } = database;
  cachedDatabases.set(pathname, database);
  registerNodeSqliteKyselyQueryErrorHandler(db, (error) => {
    // Write transactions own rollback and evict at their outer boundary.
    if (!db.isTransaction && isSqliteCorruptionError(error)) {
      evictCachedNatesclawStateDatabase(database);
    }
  });
  terminalOpenLatch.clear(pathname);
  return database;
}

function getCachedNatesclawStateDatabase(pathname: string): NatesclawStateDatabase | undefined {
  return cachedDatabases.get(path.resolve(pathname));
}

function getNatesclawStateDatabaseIfOpenAtPath(pathname: string): NatesclawStateDatabase | undefined {
  const cached = getCachedNatesclawStateDatabase(pathname);
  return cached?.db.isOpen ? cached : undefined;
}

/** Remove a closed cached owner while fresh-open access is held. */
function closeStaleCachedNatesclawStateDatabase(database: NatesclawStateDatabase): void {
  if (cachedDatabases.get(database.path) !== database) {
    return;
  }
  database.walMaintenance.close();
  clearNodeSqliteKyselyCacheForDatabase(database.db);
  cachedDatabases.delete(database.path);
}

/** Latch background verification damage so later opens fail without rescanning. */
function recordNatesclawStateDatabaseOpenFailure(
  pathname: string,
  error: Error,
  generation?: SqliteFileGeneration,
): boolean {
  return terminalOpenLatch.record(pathname, error, generation);
}

/** Clear a terminal open failure after doctor rewrites the database file. */
function clearNatesclawStateDatabaseOpenFailure(pathname: string): void {
  terminalOpenLatch.clear(pathname);
}

/** Reject shared-state access after a process-local terminal failure. */
function assertNatesclawStateDatabaseOpenAllowed(pathname: string): void {
  const terminalFailure = terminalOpenLatch.get(pathname);
  if (terminalFailure) {
    throw terminalFailure;
  }
}

/** Reject a fresh shared-state open after known corruption until repair clears it. */
function assertNatesclawStateDatabaseFreshOpenAllowedAtPath(
  pathname: string,
  env: NodeJS.ProcessEnv,
): void {
  assertNatesclawStateDatabaseOpenAllowed(pathname);
  let quarantineFailure: Error | undefined;
  try {
    const quarantine = readNatesclawDatabaseQuarantine(pathname, { env });
    if (quarantine) {
      quarantineFailure = createNatesclawDatabaseVerificationError(
        "state",
        pathname,
        quarantine.reason,
      );
    }
  } catch {
    // A broken quarantine store must not brick every state read.
    // The process latch and daily verifier still cover known damage.
  }
  if (quarantineFailure) {
    throw quarantineFailure;
  }
}

/** Close one cached shared state database handle by exact pathname. */
function closeNatesclawStateDatabaseByPath(pathname: string): boolean {
  const resolvedPath = path.resolve(pathname);
  const database = cachedDatabases.get(resolvedPath);
  if (!database) {
    return false;
  }
  database.walMaintenance.close();
  if (database.db.isOpen) {
    database.db.close();
  }
  cachedDatabases.delete(resolvedPath);
  return true;
}

/** Close all cached shared state database handles. */
function closeNatesclawStateDatabase(): void {
  for (const database of cachedDatabases.values()) {
    database.walMaintenance.close();
    if (database.db.isOpen) {
      database.db.close();
    }
  }
  cachedDatabases.clear();
}

/** Test whether any cached shared state database handle is still open. */
function isNatesclawStateDatabaseOpen(): boolean {
  return Array.from(cachedDatabases.values()).some((database) => database.db.isOpen);
}

/** Close shared state handles and clear terminal failure latches for test isolation. */
function closeNatesclawStateDatabaseForTest(): void {
  closeNatesclawStateDatabase();
  terminalOpenLatch.clearAll();
}

/** Process-wide owner for cached shared-state handles and terminal open failures. */
export const NatesclawStateDatabaseCache = {
  assertNatesclawStateDatabaseFreshOpenAllowedAtPath,
  assertNatesclawStateDatabaseOpenAllowed,
  clearNatesclawStateDatabaseOpenFailure,
  closeNatesclawStateDatabase,
  closeNatesclawStateDatabaseByPath,
  closeNatesclawStateDatabaseForTest,
  closeNatesclawStateDatabaseHandle,
  closeStaleCachedNatesclawStateDatabase,
  evictCachedNatesclawStateDatabase,
  evictNatesclawStateDatabaseAfterCorruption,
  getCachedNatesclawStateDatabase,
  getNatesclawStateDatabaseIfOpenAtPath,
  isNatesclawStateDatabaseOpen,
  publishNatesclawStateDatabase,
  recordNatesclawStateDatabaseOpenFailure,
};
