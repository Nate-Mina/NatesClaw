// Natesclaw state database manages shared persisted state and migrations.
import { existsSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import {
  clearNodeSqliteKyselyCacheForDatabase,
  enableNodeSqliteKyselyStatementCache,
  executeSqliteQuerySync,
  getNodeSqliteKysely,
} from "../infra/kysely-sync.js";
import { openNodeSqliteDatabase } from "../infra/node-sqlite.js";
import { createSqliteLifecycleAggregateError } from "../infra/sqlite-coordinator.js";
import type { SqliteFileGeneration } from "../infra/sqlite-file-generation.js";
import {
  repairCanonicalSqliteIndexes,
  verifyAndRepairCanonicalSqliteIndexes,
} from "../infra/sqlite-index-schema.js";
import {
  assertSqliteIntegrity,
  confirmSqliteFileIntegrity,
  isTerminalSqliteIntegrityError,
  type SqliteIntegrityConfirmation,
} from "../infra/sqlite-integrity.js";
import { prepareSqliteReadOnlyLocation } from "../infra/sqlite-readonly-location.js";
import { assertSqliteSchemaTablesPresent } from "../infra/sqlite-schema-contract.js";
import { migrateSqliteSchemaToStrictInTransaction } from "../infra/sqlite-strict.js";
import {
  isSqliteCorruptionError,
  runSqliteImmediateTransactionSync,
  type SqliteTransactionOptions,
} from "../infra/sqlite-transaction.js";
import { readSqliteUserVersion } from "../infra/sqlite-user-version.js";
import {
  configureSqliteConnectionPragmas,
  configureSqlitePreSchemaPragmas,
  type SqliteWalMaintenance,
} from "../infra/sqlite-wal.js";
import { migrateLegacyCronRunLogsToTaskRuns } from "../infra/state-migrations.cron-run-logs.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { VERSION } from "../version.js";
import { clearNatesclawDatabaseQuarantine } from "./natesclaw-quarantine-store.js";
import { repairAuditEventsSchema } from "./natesclaw-state-db-audit-migration.js";
import { NatesclawStateDatabaseCache as stateDbCache } from "./natesclaw-state-db-cache.js";
import {
  NATESCLAW_DATABASE_SCHEMA_DOCS_URL,
  LAZY_ADDITIVE_STATE_TABLES,
  NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
  NATESCLAW_STATE_SCHEMA_VERSION,
  NATESCLAW_STATE_STRICT_SCHEMA_VERSION,
  type NatesclawStateDatabase,
  type NatesclawStateDatabaseOptions,
} from "./natesclaw-state-db-contract.js";
import {
  assertNatesclawStateDatabaseForMaintenance,
  assertNatesclawStateDatabaseV5ForMigration,
  assertSupportedSchemaVersion,
  resolveDatabasePath,
} from "./natesclaw-state-db-maintenance.js";
import * as operatorApprovalMigration from "./natesclaw-state-db-operator-approval-migration.js";
import { ensureNatesclawStatePermissions } from "./natesclaw-state-db-permissions.js";
import { ensureAdditiveStateColumns } from "./natesclaw-state-db-schema-additive.js";
import { tableExists } from "./natesclaw-state-db-schema-helpers.js";
import {
  assertCanonicalStateSchemaShape,
  detectNatesclawStateDatabaseSchemaMigrationsFromDatabase,
  dropLegacyStateTables,
  markCurrentStateSchemaVersion,
  repairAgentDatabasesCompositePrimaryKey,
  repairLegacyGatewayRestartHandoffsForStrictMigration,
} from "./natesclaw-state-db-schema-repair.js";
import * as sessionWatchMigration from "./natesclaw-state-db-session-watch-migration.js";
import type { DB as NatesclawStateKyselyDatabase } from "./natesclaw-state-db.generated.js";
import {
  assertNatesclawStateWriteAllowed,
  NatesclawStateOwnershipError,
  runWithNatesclawStateWriteAccess,
} from "./natesclaw-state-ownership.js";
import { getNatesclawStateRuntimeSchema } from "./natesclaw-state-schema-compatibility.js";
import { NATESCLAW_STATE_SCHEMA_SQL } from "./natesclaw-state-schema.js";

export {
  NATESCLAW_DATABASE_SCHEMA_DOCS_URL,
  NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
  NATESCLAW_STATE_SCHEMA_VERSION,
};
export type {
  NatesclawStateDatabase,
  NatesclawStateDatabaseOptions,
  NatesclawStateDatabaseSchemaMigration,
} from "./natesclaw-state-db-contract.js";
export {
  assertNatesclawStateDatabaseForMaintenance,
  createNatesclawDatabaseVerificationError,
} from "./natesclaw-state-db-maintenance.js";
export { ensureNatesclawStatePermissions } from "./natesclaw-state-db-permissions.js";
export { detectNatesclawStateDatabaseSchemaMigrations } from "./natesclaw-state-db-schema-repair.js";
export { withNatesclawStateStartupMigrationCheckpointDatabase } from "./natesclaw-state-db-startup-checkpoint.js";

/** Reconfirm an advisory worker failure on the live owner connection. */
export function confirmNatesclawStateDatabaseIntegrity(
  pathname: string,
): SqliteIntegrityConfirmation {
  const resolvedPath = path.resolve(pathname);
  closeNatesclawStateDatabaseByPath(resolvedPath);
  return confirmSqliteFileIntegrity(resolvedPath, resolvedPath);
}

/** Latch background verification damage so later opens fail without rescanning. */
export function recordNatesclawStateDatabaseOpenFailure(
  pathname: string,
  error: Error,
  generation?: SqliteFileGeneration,
): boolean {
  return stateDbCache.recordNatesclawStateDatabaseOpenFailure(pathname, error, generation);
}

/** Clear a terminal open failure after doctor rewrites the database file. */
export function clearNatesclawStateDatabaseOpenFailure(pathname: string): void {
  stateDbCache.clearNatesclawStateDatabaseOpenFailure(pathname);
}

/** Reject a fresh shared-state open after known corruption until repair clears it. */
export function assertNatesclawStateDatabaseFreshOpenAllowed(
  options: NatesclawStateDatabaseOptions = {},
): void {
  const env = options.env ?? process.env;
  stateDbCache.assertNatesclawStateDatabaseFreshOpenAllowedAtPath(resolveDatabasePath(options), env);
}

type NatesclawStateMetadataDatabase = Pick<NatesclawStateKyselyDatabase, "schema_meta">;
const stateDbLog = createSubsystemLogger("state/db");

function executeCanonicalStateSchema(
  database: DatabaseSync,
  options: { includeVersionLazyAdditiveTables: boolean },
): void {
  database.exec(getNatesclawStateRuntimeSchema(options));
}

function repairNatesclawStateDatabaseSchemaWithWriteAccess(
  pathname: string,
  env: NodeJS.ProcessEnv,
): {
  changes: string[];
  warnings: string[];
} {
  ensureNatesclawStatePermissions(pathname, env);
  const db = openNodeSqliteDatabase(pathname);
  const rebuiltIndexNames = new Set<string>();
  let ownershipRefused = false;
  try {
    db.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
    assertSupportedSchemaVersion(db, pathname);
    db.exec("PRAGMA foreign_keys = OFF;");
    const changes = runSqliteImmediateTransactionSync(
      db,
      () => {
        assertNatesclawStateWriteAllowed({ database: db, databasePath: pathname, env });
        const applied: string[] = [];
        const previousVersion = readSqliteUserVersion(db);
        if (previousVersion === NATESCLAW_STATE_SCHEMA_VERSION) {
          for (const name of repairCanonicalSqliteIndexes(db, pathname, NATESCLAW_STATE_SCHEMA_SQL, {
            allowMissingColumns: true,
          })) {
            rebuiltIndexNames.add(name);
          }
          // Current-schema doctor repair may normalize recognized columns or
          // table options, but it must never recreate a missing table empty.
          assertSqliteSchemaTablesPresent(db, pathname, NATESCLAW_STATE_SCHEMA_SQL, {
            allowedMissingTables: LAZY_ADDITIVE_STATE_TABLES,
          });
        }
        if (rebuiltIndexNames.size === 0) {
          assertSqliteIntegrity(db, pathname);
        }
        dropLegacyStateTables(db);
        if (repairAgentDatabasesCompositePrimaryKey(db)) {
          applied.push(`Migrated shared state agent database registry primary key → agent_id,path`);
        }
        if (repairAuditEventsSchema(db)) {
          applied.push(
            `Migrated shared state audit event ledger → versioned message lifecycle schema`,
          );
        }
        applied.push(...operatorApprovalMigration.repairOperatorApprovalSchema(db));
        const needsSessionWatchMigration =
          sessionWatchMigration.needsSessionWatchCursorProvenanceMigration(db, previousVersion);
        const sessionWatchResult = sessionWatchMigration.migrateSessionWatchCursorProvenance(db);
        if (needsSessionWatchMigration) {
          applied.push(
            `Migrated shared state session watch cursors → provenance column (${sessionWatchResult.migratedAmbientWatches} ambient, ${sessionWatchResult.removedLegacySentinels} sentinels removed)`,
          );
        }
        assertCanonicalStateSchemaShape(db, pathname);
        if (tableExists(db, "audit_events")) {
          ensureAdditiveStateColumns(db);
          executeCanonicalStateSchema(db, {
            includeVersionLazyAdditiveTables: previousVersion !== NATESCLAW_STATE_SCHEMA_VERSION,
          });
          if (previousVersion < NATESCLAW_STATE_STRICT_SCHEMA_VERSION) {
            repairLegacyGatewayRestartHandoffsForStrictMigration(db);
          }
          const strictMigration = migrateSqliteSchemaToStrictInTransaction(
            db,
            getNatesclawStateRuntimeSchema({
              includeVersionLazyAdditiveTables: previousVersion !== NATESCLAW_STATE_SCHEMA_VERSION,
            }),
            { databaseLabel: pathname },
          );
          if (strictMigration.migratedTables.length > 0) {
            applied.push(
              `Migrated shared state tables to SQLite STRICT typing (${strictMigration.migratedTables.length})`,
            );
          }
          for (const name of repairCanonicalSqliteIndexes(db, pathname, NATESCLAW_STATE_SCHEMA_SQL, {
            verifyPhysicalIntegrity: false,
          })) {
            rebuiltIndexNames.add(name);
          }
        }
        markCurrentStateSchemaVersion(db, {
          createMetadataIfMissing: previousVersion < NATESCLAW_STATE_SCHEMA_VERSION,
        });
        if (readSqliteUserVersion(db) === NATESCLAW_STATE_SCHEMA_VERSION) {
          assertCurrentStateRuntimeSchema(db, pathname);
        }
        if (rebuiltIndexNames.size > 0) {
          applied.push(`Rebuilt canonical shared-state SQLite indexes (${rebuiltIndexNames.size})`);
        }
        return applied;
      },
      {
        busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
        databaseLabel: pathname,
        operationLabel: "state.schema.repair",
      },
    );
    const quarantineCleared = clearNatesclawDatabaseQuarantine(pathname, { env });
    clearNatesclawStateDatabaseOpenFailure(pathname);
    return {
      changes,
      warnings: quarantineCleared
        ? []
        : [
            `Persisted quarantine record for ${pathname} could not be cleared; rerun natesclaw doctor --fix so the repaired database is not refused again.`,
          ],
    };
  } catch (err) {
    if (err instanceof NatesclawStateOwnershipError) {
      ownershipRefused = true;
      throw err;
    }
    // Reaching this catch inside doctor means repair itself refused or failed,
    // so the runtime asserts' "run natesclaw doctor --fix" advice is circular here.
    const reason = String(err).replace(
      /has a legacy ([a-z ]+) schema; run natesclaw doctor --fix to migrate it\./u,
      "has a legacy $1 schema; automatic repair refused the unrecognized schema shape.",
    );
    return {
      changes: [],
      warnings: [`Failed migrating shared state database schema at ${pathname}: ${reason}`],
    };
  } finally {
    if (db.isOpen) {
      db.exec("PRAGMA foreign_keys = ON;");
    }
    clearNodeSqliteKyselyCacheForDatabase(db);
    db.close();
    if (!ownershipRefused) {
      ensureNatesclawStatePermissions(pathname, env);
    }
  }
}

export function repairNatesclawStateDatabaseSchema(options: NatesclawStateDatabaseOptions = {}): {
  changes: string[];
  warnings: string[];
} {
  const env = options.env ?? process.env;
  const pathname = resolveDatabasePath(options);
  if (!existsSync(pathname)) {
    return { changes: [], warnings: [] };
  }
  return runWithNatesclawStateWriteAccess(
    { databasePath: pathname, env },
    "state schema repair",
    () => repairNatesclawStateDatabaseSchemaWithWriteAccess(pathname, env),
  );
}

function needsNatesclawStateDatabaseSchemaRepair(pathname: string): boolean {
  let database: DatabaseSync | undefined;
  try {
    database = openNodeSqliteDatabase(pathname, { readOnly: true });
    assertSupportedSchemaVersion(database, pathname);
    const needsRepair =
      readSqliteUserVersion(database) !== NATESCLAW_STATE_SCHEMA_VERSION ||
      detectNatesclawStateDatabaseSchemaMigrationsFromDatabase(database, pathname).length > 0;
    if (!needsRepair) {
      assertCurrentStateRuntimeSchema(database, pathname);
    }
    return needsRepair;
  } catch {
    // Preserve the repair path's existing diagnostics for unreadable or noncanonical databases.
    return true;
  } finally {
    database?.close();
  }
}

/** Skip the exclusive doctor repair when automatic migration sees a canonical current schema. */
export function repairNatesclawStateDatabaseSchemaIfNeeded(
  options: NatesclawStateDatabaseOptions = {},
): {
  changes: string[];
  warnings: string[];
} {
  const env = options.env ?? process.env;
  const pathname = resolveDatabasePath(options);
  if (!existsSync(pathname)) {
    return { changes: [], warnings: [] };
  }

  return runWithNatesclawStateWriteAccess(
    { databasePath: pathname, env },
    "state schema repair preflight/repair",
    () =>
      needsNatesclawStateDatabaseSchemaRepair(pathname)
        ? repairNatesclawStateDatabaseSchemaWithWriteAccess(pathname, env)
        : { changes: [], warnings: [] },
  );
}

function ensureSchema(db: DatabaseSync, pathname: string, env: NodeJS.ProcessEnv): void {
  const now = Date.now();
  const kysely = getNodeSqliteKysely<NatesclawStateMetadataDatabase>(db);
  // Rebuilding referenced tables requires disabling FK enforcement before BEGIN.
  db.exec("PRAGMA foreign_keys = OFF;");
  try {
    runSqliteImmediateTransactionSync(
      db,
      () => {
        // Recheck ownership after BEGIN IMMEDIATE so no current-schema repair
        // can race a durable external ownership claim.
        assertNatesclawStateWriteAllowed({ database: db, databasePath: pathname, env });
        assertSupportedSchemaVersion(db, pathname);
        const previousVersion = readSqliteUserVersion(db);
        if (previousVersion === NATESCLAW_STATE_SCHEMA_VERSION) {
          verifyAndRepairCanonicalSqliteIndexes(db, pathname, NATESCLAW_STATE_SCHEMA_SQL, {
            allowMissingColumns: true,
            validateAfterRepair: () => assertCurrentStateRuntimeSchema(db, pathname),
          });
          ensureAdditiveStateColumns(db);
          assertCurrentStateRuntimeSchema(db, pathname);
        } else if (previousVersion === 5) {
          assertNatesclawStateDatabaseV5ForMigration(db, { pathname });
        }
        dropLegacyStateTables(db);
        ensureAdditiveStateColumns(db);
        sessionWatchMigration.migrateSessionWatchCursorProvenance(db);
        assertCanonicalStateSchemaShape(db, pathname);
        executeCanonicalStateSchema(db, {
          includeVersionLazyAdditiveTables: previousVersion !== NATESCLAW_STATE_SCHEMA_VERSION,
        });
        migrateLegacyCronRunLogsToTaskRuns(db);
        if (previousVersion < NATESCLAW_STATE_STRICT_SCHEMA_VERSION) {
          repairLegacyGatewayRestartHandoffsForStrictMigration(db);
          migrateSqliteSchemaToStrictInTransaction(
            db,
            getNatesclawStateRuntimeSchema({
              includeVersionLazyAdditiveTables: previousVersion !== NATESCLAW_STATE_SCHEMA_VERSION,
            }),
            { databaseLabel: pathname },
          );
        }
        repairCanonicalSqliteIndexes(db, pathname, NATESCLAW_STATE_SCHEMA_SQL, {
          verifyPhysicalIntegrity: false,
        });
        db.exec(`PRAGMA user_version = ${NATESCLAW_STATE_SCHEMA_VERSION};`);
        executeSqliteQuerySync(
          db,
          kysely
            .insertInto("schema_meta")
            .values({
              meta_key: "primary",
              role: "global",
              schema_version: NATESCLAW_STATE_SCHEMA_VERSION,
              agent_id: null,
              app_version: VERSION,
              created_at: now,
              updated_at: now,
            })
            .onConflict((conflict) =>
              conflict.column("meta_key").doUpdateSet({
                role: "global",
                schema_version: NATESCLAW_STATE_SCHEMA_VERSION,
                agent_id: null,
                app_version: VERSION,
                updated_at: now,
              }),
            ),
        );
        assertNatesclawStateDatabaseForMaintenance(db, { pathname });
      },
      {
        busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
        databaseLabel: pathname,
        operationLabel: "state.schema.ensure",
      },
    );
  } finally {
    db.exec("PRAGMA foreign_keys = ON;");
  }
}

/** Open existing shared state without creating, migrating, chmodding, or configuring it. */
export async function openExistingNatesclawStateDatabaseReadOnly(
  options: NatesclawStateDatabaseOptions = {},
): Promise<NatesclawStateDatabase | undefined> {
  const pathname = resolveDatabasePath(options);
  if (!existsSync(pathname)) {
    return undefined;
  }
  assertNatesclawStateDatabaseFreshOpenAllowed(options);
  const prepared = await prepareSqliteReadOnlyLocation(pathname);
  let db: DatabaseSync;
  try {
    db = openNodeSqliteDatabase(prepared.location, {
      readOnly: true,
    });
  } catch (error) {
    prepared.cleanup();
    throw error;
  }
  try {
    db.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
    assertSupportedSchemaVersion(db, pathname);
    assertSqliteIntegrity(db, pathname);
    if (readSqliteUserVersion(db) === NATESCLAW_STATE_SCHEMA_VERSION) {
      assertNatesclawStateDatabaseForMaintenance(db, { pathname });
    }
  } catch (error) {
    try {
      clearNodeSqliteKyselyCacheForDatabase(db);
      db.close();
    } catch {
      // Preserve the verification failure that explains why the database was refused.
    }
    prepared.cleanup();
    throw error;
  }
  let cleanupComplete = false;
  return {
    db,
    path: pathname,
    walMaintenance: {
      checkpoint: () => false,
      // Cleanup can fail transiently after the database closes. Keep the
      // close contract retryable until one call finishes both responsibilities.
      close: () => {
        const wasOpen = db.isOpen;
        if (!wasOpen && cleanupComplete) {
          return false;
        }
        try {
          if (wasOpen) {
            clearNodeSqliteKyselyCacheForDatabase(db);
            db.close();
          }
        } finally {
          cleanupComplete = prepared.cleanup();
        }
        return cleanupComplete;
      },
    },
  };
}

function assertCurrentStateRuntimeSchema(database: DatabaseSync, pathname: string): void {
  assertCanonicalStateSchemaShape(database, pathname);
  assertNatesclawStateDatabaseForMaintenance(database, { pathname });
}

function assertStateDatabaseIntegrityBeforeMutation(
  database: DatabaseSync,
  pathname: string,
): void {
  database.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
  const userVersion = readSqliteUserVersion(database);
  const hasApplicationSchema = database
    .prepare("SELECT 1 FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1")
    .get();
  const migrationPending =
    (userVersion === 0 && hasApplicationSchema) ||
    (userVersion > 0 && userVersion < NATESCLAW_STATE_SCHEMA_VERSION);
  if (migrationPending) {
    stateDbLog.info("state database schema migration pending; verifying integrity first", {
      fromVersion: userVersion,
      path: pathname,
      toVersion: NATESCLAW_STATE_SCHEMA_VERSION,
    });
  }
  if (userVersion !== NATESCLAW_STATE_SCHEMA_VERSION) {
    // Every physical open proves the full file before schema mutation or exposure.
    assertSqliteIntegrity(database, pathname);
  }
}

function openUnpublishedNatesclawStateDatabase(
  pathname: string,
  env: NodeJS.ProcessEnv,
): NatesclawStateDatabase {
  ensureNatesclawStatePermissions(pathname, env);
  const db = openNodeSqliteDatabase(pathname);
  enableNodeSqliteKyselyStatementCache(db);
  const walMaintenance = (() => {
    let maintenance: SqliteWalMaintenance | undefined;
    try {
      db.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
      assertSupportedSchemaVersion(db, pathname);
      assertStateDatabaseIntegrityBeforeMutation(db, pathname);
      configureSqlitePreSchemaPragmas(db, {
        busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
      });
      maintenance = configureSqliteConnectionPragmas(db, {
        busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
        databaseLabel: "natesclaw-state",
        databasePath: pathname,
        foreignKeys: true,
        synchronous: "NORMAL",
      });
      ensureSchema(db, pathname, env);
      return maintenance;
    } catch (err) {
      maintenance?.close();
      db.close();
      if (
        err instanceof Error &&
        (err.name === "SqliteSchemaVersionError" || isTerminalSqliteIntegrityError(err))
      ) {
        recordNatesclawStateDatabaseOpenFailure(pathname, err);
      }
      throw err;
    }
  })();
  ensureNatesclawStatePermissions(pathname, env);
  return { db, path: pathname, walMaintenance };
}

/** Open or return a cached shared state database after schema and migration checks. */

export function openNatesclawStateDatabase(
  options: NatesclawStateDatabaseOptions = {},
): NatesclawStateDatabase {
  const env = options.env ?? process.env;
  if (options.database) {
    assertNatesclawStateWriteAllowed({
      database: options.database.db,
      databasePath: options.database.path,
      env,
    });
    return options.database;
  }
  const pathname = resolveDatabasePath(options);
  // Latched paths are quarantined: the recorder closed any live handle, and
  // every open fails fast here until doctor repairs the file and clears it.
  stateDbCache.assertNatesclawStateDatabaseOpenAllowed(pathname);
  const cached = stateDbCache.getCachedNatesclawStateDatabase(pathname);
  if (cached?.db.isOpen) {
    assertNatesclawStateWriteAllowed({ database: cached.db, databasePath: pathname, env });
    return cached;
  }
  assertNatesclawStateDatabaseFreshOpenAllowed(options);
  let unpublished: NatesclawStateDatabase | undefined;
  try {
    unpublished = runWithNatesclawStateWriteAccess(
      { databasePath: pathname, env },
      "fresh state database open",
      () => {
        if (cached) {
          // A closed handle can leave Kysely and WAL helpers cached; clear both under access.
          stateDbCache.closeStaleCachedNatesclawStateDatabase(cached);
        }
        return (unpublished = openUnpublishedNatesclawStateDatabase(pathname, env));
      },
    );
  } catch (error) {
    if (!unpublished) {
      throw error;
    }
    const cleanup = stateDbCache.closeNatesclawStateDatabaseHandle(unpublished);
    if (cleanup.caught) {
      throw createSqliteLifecycleAggregateError(
        [error, ...cleanup.errors],
        `Fresh Natesclaw state database open failed releasing access and closing its unpublished handle for ${pathname}.`,
        error,
      );
    }
    throw error;
  }
  return stateDbCache.publishNatesclawStateDatabase(unpublished);
}

/** Run a synchronous immediate transaction against the shared state database. */
export function runNatesclawStateWriteTransaction<T>(
  operation: (database: NatesclawStateDatabase) => T,
  options: NatesclawStateDatabaseOptions = {},
  transactionOptions: Pick<
    SqliteTransactionOptions,
    "busyTimeoutMs" | "operationLabel" | "slowTransactionHoldMs"
  > = {},
): T {
  const cachedBeforeOpen = options.database ?? getNatesclawStateDatabaseIfOpen(options);
  let database: NatesclawStateDatabase;
  try {
    database = openNatesclawStateDatabase(options);
  } catch (error) {
    if (cachedBeforeOpen && isSqliteCorruptionError(error)) {
      stateDbCache.evictCachedNatesclawStateDatabase(cachedBeforeOpen);
    }
    throw error;
  }
  let result: T;
  try {
    result = runSqliteImmediateTransactionSync(
      database.db,
      () => {
        assertNatesclawStateWriteAllowed({
          database: database.db,
          databasePath: database.path,
          env: options.env ?? process.env,
        });
        return operation(database);
      },
      {
        busyTimeoutMs: transactionOptions.busyTimeoutMs ?? NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
        databaseLabel: database.path,
        ...transactionOptions,
        operationLabel: transactionOptions.operationLabel ?? "state.write",
      },
    );
  } catch (error) {
    if (isSqliteCorruptionError(error)) {
      stateDbCache.evictCachedNatesclawStateDatabase(database);
    }
    throw error;
  }
  try {
    ensureNatesclawStatePermissions(database.path, options.env ?? process.env);
  } catch {
    // The write already committed; permission hardening is best-effort here so
    // callers never retry an operation that is durable in SQLite.
  }
  return result;
}

/**
 * Return a shared state handle this process already holds open, if any.
 *
 * Read-only callers use this to avoid opening a connection per call; it never
 * creates, repairs, or registers a handle.
 */
export function getNatesclawStateDatabaseIfOpen(
  options: NatesclawStateDatabaseOptions = {},
): NatesclawStateDatabase | undefined {
  return stateDbCache.getNatesclawStateDatabaseIfOpenAtPath(resolveDatabasePath(options));
}

/** Evict an exact cached shared-state owner after a proven corruption read. */
export function evictNatesclawStateDatabaseAfterCorruption(
  database: NatesclawStateDatabase,
  error: unknown,
): boolean {
  return stateDbCache.evictNatesclawStateDatabaseAfterCorruption(database, error);
}

/** Close one cached shared state database handle by exact pathname. */
export function closeNatesclawStateDatabaseByPath(pathname: string): boolean {
  return stateDbCache.closeNatesclawStateDatabaseByPath(pathname);
}

/** Close all cached shared state database handles. */
export function closeNatesclawStateDatabase(): void {
  stateDbCache.closeNatesclawStateDatabase();
}

/** Test whether any cached shared state database handle is still open. */
export function isNatesclawStateDatabaseOpen(): boolean {
  return stateDbCache.isNatesclawStateDatabaseOpen();
}

/** Close shared state handles and clear terminal failure latches for test isolation. */
export function closeNatesclawStateDatabaseForTest(): void {
  stateDbCache.closeNatesclawStateDatabaseForTest();
}
