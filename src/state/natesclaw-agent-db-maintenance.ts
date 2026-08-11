import type { DatabaseSync } from "node:sqlite";
import { clearNodeSqliteKyselyCacheForDatabase } from "../infra/kysely-sync.js";
import { openNodeSqliteDatabase } from "../infra/node-sqlite.js";
import {
  createNewerSqliteSchemaVersionError,
  readSqliteUserVersion,
} from "../infra/sqlite-user-version.js";
import { normalizeAgentId } from "../routing/session-key.js";
import { NATESCLAW_AGENT_SCHEMA_VERSION } from "./natesclaw-agent-db-contract.js";
import {
  assertExistingAgentSchemaOwner,
  assertNatesclawAgentSchemaContains,
  assertSupportedAgentSchemaVersion,
  readExistingAgentSchemaMeta,
} from "./natesclaw-agent-db-schema-helpers.js";
import { ensureNatesclawAgentDatabaseSchema } from "./natesclaw-agent-db-schema.js";
import { NATESCLAW_AGENT_SCHEMA_SQL } from "./natesclaw-agent-schema.js";
import { NATESCLAW_SQLITE_BUSY_TIMEOUT_MS } from "./natesclaw-state-db.js";

/** Require exact agent ownership without requiring the latest schema. */
export function assertNatesclawAgentDatabaseOwner(
  database: DatabaseSync,
  options: { agentId: string; pathname: string },
): NonNullable<ReturnType<typeof readExistingAgentSchemaMeta>> {
  const agentId = normalizeAgentId(options.agentId);
  const metadata = readExistingAgentSchemaMeta(database);
  if (!metadata) {
    throw new Error(
      `Natesclaw agent database ${options.pathname} has no schema ownership metadata.`,
    );
  }
  assertExistingAgentSchemaOwner(metadata, agentId, options.pathname);
  if (metadata.agentId !== agentId) {
    throw new Error(
      `Natesclaw agent database ${options.pathname} belongs to agent ${metadata.agentId}; requested agent ${agentId}.`,
    );
  }
  return metadata;
}

/** Require the exact agent owner and schema before offline file maintenance. */
export function assertNatesclawAgentDatabaseForMaintenance(
  database: DatabaseSync,
  options: { agentId: string; pathname: string },
): void {
  const metadata = assertNatesclawAgentDatabaseOwner(database, options);

  const userVersion = readSqliteUserVersion(database);
  if (userVersion > NATESCLAW_AGENT_SCHEMA_VERSION) {
    throw createNewerSqliteSchemaVersionError(
      "Natesclaw agent database",
      options.pathname,
      userVersion,
      NATESCLAW_AGENT_SCHEMA_VERSION,
    );
  }
  if (userVersion !== NATESCLAW_AGENT_SCHEMA_VERSION) {
    throw new Error(
      `Natesclaw agent database ${options.pathname} uses schema version ${userVersion}; run natesclaw doctor --fix before compacting it.`,
    );
  }
  if (metadata.schemaVersion !== NATESCLAW_AGENT_SCHEMA_VERSION) {
    throw new Error(
      `Natesclaw agent database ${options.pathname} metadata schema version ${metadata.schemaVersion ?? "invalid"} does not match ${NATESCLAW_AGENT_SCHEMA_VERSION}; run natesclaw doctor --fix before compacting it.`,
    );
  }
  assertNatesclawAgentSchemaContains(database, options.pathname, NATESCLAW_AGENT_SCHEMA_SQL);
}

/** Upgrade or repair a supported owned schema before strict offline maintenance. */
export function migrateNatesclawAgentDatabaseForMaintenance(options: {
  agentId: string;
  pathname: string;
}): void {
  const agentId = normalizeAgentId(options.agentId);
  const database = openNodeSqliteDatabase(options.pathname);
  try {
    database.exec(`PRAGMA busy_timeout = ${NATESCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
    const metadata = readExistingAgentSchemaMeta(database);
    if (!metadata) {
      return;
    }
    assertExistingAgentSchemaOwner(metadata, agentId, options.pathname);
    assertSupportedAgentSchemaVersion(database, options.pathname);
    const userVersion = readSqliteUserVersion(database);
    const metadataVersion = metadata.schemaVersion;
    const hasCurrentVersion =
      userVersion === NATESCLAW_AGENT_SCHEMA_VERSION &&
      metadataVersion === NATESCLAW_AGENT_SCHEMA_VERSION;
    const hasSupportedOlderVersion =
      userVersion >= 1 &&
      userVersion < NATESCLAW_AGENT_SCHEMA_VERSION &&
      metadataVersion !== null &&
      metadataVersion === userVersion &&
      metadataVersion >= 1 &&
      metadataVersion < NATESCLAW_AGENT_SCHEMA_VERSION;
    if (!hasCurrentVersion && !hasSupportedOlderVersion) {
      return;
    }
    ensureNatesclawAgentDatabaseSchema(database, {
      agentId,
      path: options.pathname,
    });
    assertNatesclawAgentDatabaseForMaintenance(database, {
      agentId,
      pathname: options.pathname,
    });
  } finally {
    clearNodeSqliteKyselyCacheForDatabase(database);
    database.close();
  }
}
