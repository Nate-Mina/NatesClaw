import { statSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { clearNodeSqliteKyselyCacheForDatabase } from "../infra/kysely-sync.js";
import { openNodeSqliteDatabase } from "../infra/node-sqlite.js";
import {
  createNewerSqliteSchemaVersionError,
  readSqliteUserVersion,
} from "../infra/sqlite-user-version.js";
import {
  assertNatesclawStateDatabaseFreshOpenAllowed,
  evictNatesclawStateDatabaseAfterCorruption,
  getNatesclawStateDatabaseIfOpen,
  NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
  NATESCLAW_STATE_SCHEMA_VERSION,
  type NatesclawStateDatabaseOptions,
} from "./natesclaw-state-db.js";
import { resolveNatesclawStateSqlitePath } from "./natesclaw-state-db.paths.js";

type NatesclawStateReadOnlyDatabase = {
  db: DatabaseSync;
  path: string;
};

type ReusedNatesclawStateReadOnlyDatabase<T> = { reused: false } | { reused: true; value: T };

function resolveReadOnlyPath(options: NatesclawStateDatabaseOptions): string {
  return path.resolve(options.path ?? resolveNatesclawStateSqlitePath(options.env ?? process.env));
}

function existingPathOrUndefined(pathname: string): string | undefined {
  try {
    statSync(pathname);
    return pathname;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function assertSupportedSchemaVersion(db: DatabaseSync, pathname: string): void {
  const userVersion = readSqliteUserVersion(db);
  if (userVersion > NATESCLAW_STATE_SCHEMA_VERSION) {
    throw createNewerSqliteSchemaVersionError(
      "Natesclaw state database",
      pathname,
      userVersion,
      NATESCLAW_STATE_SCHEMA_VERSION,
    );
  }
}

function withNatesclawStateDatabaseReadOnlyIfOpen<T>(
  operation: (database: NatesclawStateReadOnlyDatabase) => T,
  options: NatesclawStateDatabaseOptions,
  pathname: string,
): ReusedNatesclawStateReadOnlyDatabase<T> {
  const opened = getNatesclawStateDatabaseIfOpen(options);
  if (!opened || opened.db.isTransaction) {
    return { reused: false };
  }
  try {
    // Process-local terminal failures evict this handle. Persisted quarantine
    // is checked on the next physical open so hot reads do not poll metadata.
    // A newer build can migrate this file while the handle stays open, so the
    // forward-compatibility gate still runs before any reused read.
    assertSupportedSchemaVersion(opened.db, pathname);
    return { reused: true, value: operation(opened) };
  } catch (error) {
    evictNatesclawStateDatabaseAfterCorruption(opened, error);
    throw error;
  }
}

function withFreshNatesclawStateDatabaseReadOnly<T>(
  operation: (database: NatesclawStateReadOnlyDatabase) => T,
  options: NatesclawStateDatabaseOptions,
  pathname: string,
): T {
  assertNatesclawStateDatabaseFreshOpenAllowed(options);
  const db = openNodeSqliteDatabase(pathname, { readOnly: true });
  try {
    db.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
    assertSupportedSchemaVersion(db, pathname);
    return operation({ db, path: pathname });
  } finally {
    clearNodeSqliteKyselyCacheForDatabase(db);
    db.close();
  }
}

/**
 * Read shared state without joining the writable lifecycle.
 *
 * CLI metadata reads can overlap a live Gateway. Keep them off schema repair,
 * journal-mode setup, checkpoints, and permission mutation owned by writers.
 */
export function withNatesclawStateDatabaseReadOnly<T>(
  operation: (database: NatesclawStateReadOnlyDatabase) => T,
  options: NatesclawStateDatabaseOptions = {},
): T {
  const pathname = resolveReadOnlyPath(options);
  // Reusing a handle this process already holds keeps row loops cheap: opening
  // and closing a connection per call made shared-state reads scale with row
  // count. An in-flight transaction is skipped so callers never observe
  // uncommitted rows a fresh read-only connection could not have seen.
  const reused = withNatesclawStateDatabaseReadOnlyIfOpen(operation, options, pathname);
  if (reused.reused) {
    return reused.value;
  }
  return withFreshNatesclawStateDatabaseReadOnly(operation, options, pathname);
}

/** Read existing shared state while preserving non-missing filesystem failures. */
export function withExistingNatesclawStateDatabaseReadOnly<T>(
  operation: (database: NatesclawStateReadOnlyDatabase) => T,
  options: NatesclawStateDatabaseOptions = {},
): T | undefined {
  const pathname = resolveReadOnlyPath(options);
  const reused = withNatesclawStateDatabaseReadOnlyIfOpen(operation, options, pathname);
  if (reused.reused) {
    return reused.value;
  }
  const existingPath = existingPathOrUndefined(pathname);
  return existingPath === undefined
    ? undefined
    : withFreshNatesclawStateDatabaseReadOnly(
        operation,
        { ...options, path: existingPath },
        existingPath,
      );
}
