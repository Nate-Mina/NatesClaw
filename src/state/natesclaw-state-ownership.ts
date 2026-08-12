import { existsSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { isRecord } from "@openclaw/normalization-core/record-coerce";
import { resolveGatewayLockDir } from "../config/paths.js";
import { resolvePathViaExistingAncestorSync } from "../infra/boundary-path.js";
import { sha256HexPrefixCore } from "../infra/crypto-digest.js";
import { isGatewayExternallySupervised } from "../infra/gateway-supervision.js";
import {
  openNodeSqliteDatabase,
  tryAcquireExclusiveSqliteCoordinator,
} from "../infra/node-sqlite.js";
import {
  createSqliteLifecycleAggregateError,
  ensurePrivateSqliteCoordinatorDirectory,
  runWithSqliteCoordinator,
  SqliteCoordinatorError,
} from "../infra/sqlite-coordinator.js";
import { prepareSqliteReadOnlyLocationSync } from "../infra/sqlite-readonly-location.js";
import { NATESCLAW_SQLITE_BUSY_TIMEOUT_MS } from "./natesclaw-state-db-contract.js";
import { tableExists } from "./natesclaw-state-db-schema-helpers.js";
import { resolveNatesclawStateDirForDatabasePath } from "./natesclaw-state-db.paths.js";

export const STATE_SUPERVISION_KEY = "gateway.supervision";
const MAX_OWNERSHIP_TIMESTAMP_MS = 8_640_000_000_000_000;
const MANAGER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

export type NatesclawExternalStateOwnership = {
  claimedAt: number;
  managerId: string;
  mode: "external";
  version: 1;
};

export class NatesclawStateOwnershipError extends Error {}

export class NatesclawStateOwnershipMetadataError extends NatesclawStateOwnershipError {
  constructor(
    readonly databasePath: string,
    message: string,
  ) {
    super(
      `Natesclaw shared state ownership metadata is invalid at ${databasePath}: ${message}. ` +
        "Repair it with NATESCLAW_SUPERVISOR_MODE=external natesclaw database ownership claim --manager <manager-id>.",
    );
    this.name = "NatesclawStateOwnershipMetadataError";
  }
}

class NatesclawStateExternalOwnershipError extends NatesclawStateOwnershipError {
  constructor(
    readonly databasePath: string,
    readonly managerId: string,
  ) {
    super(
      `Natesclaw shared state database ${databasePath} is externally supervised by ${managerId}. ` +
        "Use that external supervisor with NATESCLAW_SUPERVISOR_MODE=external for writable operations.",
    );
    this.name = "NatesclawStateExternalOwnershipError";
  }
}

export function normalizeNatesclawStateManagerId(managerId: string): string {
  const normalized = managerId.trim();
  if (!MANAGER_ID_PATTERN.test(normalized)) {
    throw new Error(
      "External state ownership manager id must be a 1-128 character ASCII identifier.",
    );
  }
  return normalized;
}

function parseExternalOwnership(
  valueJson: string,
  databasePath: string,
): NatesclawExternalStateOwnership {
  let value: unknown;
  try {
    value = JSON.parse(valueJson) as unknown;
  } catch {
    throw new NatesclawStateOwnershipMetadataError(databasePath, "reserved value is not valid JSON");
  }
  const record = isRecord(value) ? value : undefined;
  const keys = record ? Object.keys(record).toSorted().join(",") : "";
  const managerId = record?.managerId;
  const claimedAt = record?.claimedAt;
  if (
    keys !== "claimedAt,managerId,mode,version" ||
    record?.version !== 1 ||
    record?.mode !== "external" ||
    typeof managerId !== "string" ||
    !MANAGER_ID_PATTERN.test(managerId) ||
    typeof claimedAt !== "number" ||
    !Number.isSafeInteger(claimedAt) ||
    claimedAt < 0 ||
    claimedAt > MAX_OWNERSHIP_TIMESTAMP_MS
  ) {
    throw new NatesclawStateOwnershipMetadataError(
      databasePath,
      "reserved value does not match the version 1 external ownership contract",
    );
  }
  return {
    version: 1,
    mode: "external",
    managerId,
    claimedAt,
  };
}

/** Inspect the reserved ownership row without entering the shared-state lifecycle. */
export function inspectNatesclawStateOwnershipFromDatabase(
  database: DatabaseSync,
  databasePath: string,
): NatesclawExternalStateOwnership | null {
  if (!tableExists(database, "config_machine_state")) {
    return null;
  }
  const row = database
    .prepare("SELECT value_json FROM config_machine_state WHERE state_key = ? LIMIT 1")
    .get(STATE_SUPERVISION_KEY) as { value_json?: unknown } | undefined;
  if (!row) {
    return null;
  }
  if (typeof row.value_json !== "string") {
    throw new NatesclawStateOwnershipMetadataError(databasePath, "reserved value is not text");
  }
  return parseExternalOwnership(row.value_json, databasePath);
}

function inspectOwnershipThroughConnection(
  location: string,
  databasePath: string,
): NatesclawExternalStateOwnership | null {
  const database = openNodeSqliteDatabase(location, { readOnly: true });
  try {
    database.exec(
      `PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS}; PRAGMA query_only = ON; PRAGMA trusted_schema = OFF;`,
    );
    return inspectNatesclawStateOwnershipFromDatabase(database, databasePath);
  } finally {
    database.close();
  }
}

function inspectJournalAwarePublicOwnership(
  databasePath: string,
): NatesclawExternalStateOwnership | null {
  const prepared = prepareSqliteReadOnlyLocationSync(databasePath);
  try {
    return inspectOwnershipThroughConnection(prepared.location, databasePath);
  } finally {
    prepared.cleanup();
  }
}

function inspectNatesclawStateOwnershipAtPathWhileCoordinatorHeld(
  databasePath: string,
): NatesclawExternalStateOwnership | null {
  const resolvedPath = path.resolve(databasePath);
  if (!existsSync(resolvedPath)) {
    return null;
  }
  // Write admission owns locking and recovery while the coordinator is held.
  // Inspect the live committed view without cloning a potentially busy family.
  const database = openNodeSqliteDatabase(resolvedPath);
  try {
    database.exec(
      `PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS}; PRAGMA trusted_schema = OFF;`,
    );
    return inspectNatesclawStateOwnershipFromDatabase(database, resolvedPath);
  } finally {
    database.close();
  }
}

function resolveNatesclawStateOwnershipCoordinatorPath(databasePath: string): string {
  const canonicalDatabasePath = resolvePathViaExistingAncestorSync(databasePath);
  const stateDir = resolveNatesclawStateDirForDatabasePath(canonicalDatabasePath);
  return path.join(
    resolveGatewayLockDir(stateDir),
    `state-ownership.${sha256HexPrefixCore(canonicalDatabasePath, 8)}.lock.sqlite`,
  );
}

function acquireNatesclawStateOwnershipCoordinator(databasePath: string): {
  release: () => void;
} {
  const coordinatorPath = resolveNatesclawStateOwnershipCoordinatorPath(databasePath);
  ensurePrivateSqliteCoordinatorDirectory(
    path.dirname(coordinatorPath),
    "state ownership coordinator",
  );
  const coordinator = tryAcquireExclusiveSqliteCoordinator(coordinatorPath, {
    busyTimeoutMs: NATESCLAW_SQLITE_BUSY_TIMEOUT_MS,
  });
  if (!coordinator) {
    throw new SqliteCoordinatorError("another Natesclaw process is changing shared state ownership");
  }
  return coordinator;
}

export function runWithNatesclawStateOwnershipCoordinator<T>(
  databasePath: string,
  operationLabel: string,
  operation: () => T,
): T {
  return runWithSqliteCoordinator(
    acquireNatesclawStateOwnershipCoordinator(databasePath),
    operationLabel,
    operation,
  );
}

/** Inspect one resolved state database path without mutating its state tree. */
export function inspectNatesclawStateOwnershipAtPath(
  databasePath: string,
): NatesclawExternalStateOwnership | null {
  const resolvedPath = path.resolve(databasePath);
  if (!existsSync(resolvedPath)) {
    return null;
  }
  return inspectJournalAwarePublicOwnership(resolvedPath);
}

function assertOwnershipAllowsWrite(
  status: NatesclawExternalStateOwnership | null,
  databasePath: string,
  env: NodeJS.ProcessEnv,
): void {
  if (status && !isGatewayExternallySupervised(env)) {
    throw new NatesclawStateExternalOwnershipError(databasePath, status.managerId);
  }
}

/** Fence and hold one path-based mutation until its main-file preamble is complete. */
function acquireNatesclawStateWriteAccess(options: {
  databasePath: string;
  env?: NodeJS.ProcessEnv;
}): { release: () => void } {
  const resolvedPath = path.resolve(options.databasePath);
  const access = acquireNatesclawStateOwnershipCoordinator(resolvedPath);
  try {
    assertOwnershipAllowsWrite(
      inspectNatesclawStateOwnershipAtPathWhileCoordinatorHeld(resolvedPath),
      resolvedPath,
      options.env ?? process.env,
    );
    return access;
  } catch (operationError) {
    let releaseFailed = false;
    let releaseError: unknown;
    try {
      access.release();
    } catch (error) {
      releaseFailed = true;
      releaseError = error;
    }
    if (releaseFailed) {
      throw createSqliteLifecycleAggregateError(
        [operationError, releaseError],
        "state ownership inspection and coordinator release both failed",
        operationError,
      );
    }
    throw operationError;
  }
}

export function runWithNatesclawStateWriteAccess<T>(
  options: { databasePath: string; env?: NodeJS.ProcessEnv },
  operationLabel: string,
  operation: () => T,
): T {
  return runWithSqliteCoordinator(
    acquireNatesclawStateWriteAccess(options),
    operationLabel,
    operation,
  );
}

/** Fence shared-state writes once an external manager has claimed ownership. */
export function assertNatesclawStateWriteAllowed(options: {
  database?: DatabaseSync;
  databasePath: string;
  env?: NodeJS.ProcessEnv;
}): void {
  const resolvedPath = path.resolve(options.databasePath);
  const status = options.database
    ? inspectNatesclawStateOwnershipFromDatabase(options.database, resolvedPath)
    : inspectNatesclawStateOwnershipAtPath(resolvedPath);
  assertOwnershipAllowsWrite(status, resolvedPath, options.env ?? process.env);
}
