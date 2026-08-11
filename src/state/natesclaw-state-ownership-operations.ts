import type { DatabaseSync } from "node:sqlite";
import { isGatewayExternallySupervised } from "../infra/gateway-supervision.js";
import {
  clearNodeSqliteKyselyCacheForDatabase,
  executeSqliteQuerySync,
  getNodeSqliteKysely,
} from "../infra/kysely-sync.js";
import { openNodeSqliteDatabase } from "../infra/node-sqlite.js";
import { assertSqliteIntegrity } from "../infra/sqlite-integrity.js";
import { runSqliteImmediateTransactionSync } from "../infra/sqlite-transaction.js";
import { configureSqliteWalMaintenance, type SqliteWalMaintenance } from "../infra/sqlite-wal.js";
import { NATESCLAW_SQLITE_BUSY_TIMEOUT_MS } from "./natesclaw-state-db-contract.js";
import {
  assertNatesclawStateDatabaseForMaintenance,
  resolveDatabasePath,
} from "./natesclaw-state-db-maintenance.js";
import type { DB as NatesclawStateKyselyDatabase } from "./natesclaw-state-db.generated.js";
import {
  openNatesclawStateDatabase,
  runNatesclawStateWriteTransaction,
  type NatesclawStateDatabaseOptions,
} from "./natesclaw-state-db.js";
import {
  inspectNatesclawStateOwnershipFromDatabase,
  normalizeNatesclawStateManagerId,
  NatesclawStateOwnershipMetadataError,
  STATE_SUPERVISION_KEY,
  type NatesclawExternalStateOwnership,
  runWithNatesclawStateOwnershipCoordinator,
} from "./natesclaw-state-ownership.js";

type NatesclawStateOwnershipOptions = Omit<NatesclawStateDatabaseOptions, "database" | "readOnly">;
type OwnershipDatabase = Pick<NatesclawStateKyselyDatabase, "config_machine_state">;

function requireOwnershipCheckpoint(
  walMaintenance: SqliteWalMaintenance,
  databasePath: string,
): void {
  if (!walMaintenance.checkpoint()) {
    throw new Error(
      `External ownership was committed for ${databasePath}, but its WAL checkpoint failed. Retry the same ownership claim before activating the supervisor.`,
    );
  }
}

function claimOwnershipRow(
  database: DatabaseSync,
  databasePath: string,
  managerId: string,
  repairMalformed: boolean,
): NatesclawExternalStateOwnership {
  let current: NatesclawExternalStateOwnership | null = null;
  try {
    current = inspectNatesclawStateOwnershipFromDatabase(database, databasePath);
  } catch (error) {
    if (!repairMalformed || !(error instanceof NatesclawStateOwnershipMetadataError)) {
      throw error;
    }
  }
  if (current) {
    if (current.managerId !== managerId) {
      throw new Error(
        `Natesclaw shared state is already claimed by external manager ${current.managerId}; ` +
          `manager ${managerId} cannot replace that durable ownership.`,
      );
    }
    return current;
  }
  const ownership: NatesclawExternalStateOwnership = {
    version: 1,
    mode: "external",
    managerId,
    claimedAt: Date.now(),
  };
  const valueJson = JSON.stringify(ownership);
  const stateDb = getNodeSqliteKysely<OwnershipDatabase>(database);
  executeSqliteQuerySync(
    database,
    stateDb
      .insertInto("config_machine_state")
      .values({
        state_key: STATE_SUPERVISION_KEY,
        value_json: valueJson,
        updated_at_ms: ownership.claimedAt,
      })
      .onConflict((conflict) =>
        conflict.column("state_key").doUpdateSet({
          value_json: valueJson,
          updated_at_ms: ownership.claimedAt,
        }),
      ),
  );
  return ownership;
}

function repairMalformedOwnershipClaim(
  databasePath: string,
  managerId: string,
): NatesclawExternalStateOwnership {
  return runWithNatesclawStateOwnershipCoordinator(
    databasePath,
    "malformed state ownership repair/checkpoint",
    () => {
      const database = openNodeSqliteDatabase(databasePath);
      let walMaintenance: SqliteWalMaintenance | undefined;
      try {
        database.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
        assertSqliteIntegrity(database, databasePath);
        assertNatesclawStateDatabaseForMaintenance(database, { pathname: databasePath });
        walMaintenance = configureSqliteWalMaintenance(database, {
          busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
          checkpointIntervalMs: 0,
          checkpointMode: "TRUNCATE",
          databaseLabel: "Natesclaw shared state ownership",
          databasePath,
        });
        const ownership = runSqliteImmediateTransactionSync(
          database,
          () => {
            assertNatesclawStateDatabaseForMaintenance(database, { pathname: databasePath });
            return claimOwnershipRow(database, databasePath, managerId, true);
          },
          {
            busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
            databaseLabel: databasePath,
            operationLabel: "state.ownership.repair",
          },
        );
        requireOwnershipCheckpoint(walMaintenance, databasePath);
        return ownership;
      } finally {
        walMaintenance?.close({ checkpointMode: "PASSIVE" });
        clearNodeSqliteKyselyCacheForDatabase(database);
        database.close();
      }
    },
  );
}

/** Claim durable shared-state write ownership for the active external supervisor. */
export function claimNatesclawStateOwnership(
  managerId: string,
  options: NatesclawStateOwnershipOptions = {},
): NatesclawExternalStateOwnership {
  const env = options.env ?? process.env;
  if (!isGatewayExternallySupervised(env)) {
    throw new Error(
      "Claiming external shared-state ownership requires NATESCLAW_SUPERVISOR_MODE=external.",
    );
  }
  const normalizedManagerId = normalizeNatesclawStateManagerId(managerId);
  try {
    const database = openNatesclawStateDatabase(options);
    return runWithNatesclawStateOwnershipCoordinator(
      database.path,
      "state ownership claim/checkpoint",
      () => {
        const ownership = runNatesclawStateWriteTransaction(
          ({ db, path: databasePath }) =>
            claimOwnershipRow(db, databasePath, normalizedManagerId, false),
          { ...options, database },
          { operationLabel: "state.ownership.claim" },
        );
        requireOwnershipCheckpoint(database.walMaintenance, database.path);
        return ownership;
      },
    );
  } catch (error) {
    if (!(error instanceof NatesclawStateOwnershipMetadataError)) {
      throw error;
    }
    const ownership = repairMalformedOwnershipClaim(
      resolveDatabasePath(options),
      normalizedManagerId,
    );
    openNatesclawStateDatabase(options);
    return ownership;
  }
}
