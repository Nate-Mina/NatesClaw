import { existsSync, lstatSync, statSync } from "node:fs";
import path from "node:path";
import { executeSqliteQuerySync, getNodeSqliteKysely } from "../infra/kysely-sync.js";
import { resolveSqliteDatabaseFilePaths } from "../infra/sqlite-files.js";
import { normalizeAgentId } from "../routing/session-key.js";
import {
  NATESCLAW_AGENT_SCHEMA_VERSION,
  type NatesclawRegisteredAgentDatabase,
} from "./natesclaw-agent-db-contract.js";
import { withNatesclawStateDatabaseReadOnly } from "./natesclaw-state-db-readonly.js";
import { detectNatesclawStateDatabaseSchemaMigrationsFromDatabase } from "./natesclaw-state-db-schema-repair.js";
import type { DB as NatesclawStateKyselyDatabase } from "./natesclaw-state-db.generated.js";
import type { NatesclawStateDatabaseOptions } from "./natesclaw-state-db.js";
import { resolveNatesclawStateSqlitePath } from "./natesclaw-state-db.paths.js";

type NatesclawAgentRegistryDatabase = Pick<NatesclawStateKyselyDatabase, "agent_databases">;

// Registry metadata is process-stable: registry writes invalidate after each commit;
// other-process changes take effect on restart. Polling here puts schema probes back on hot reads.
let registeredAgentDatabasesMemo:
  | {
      pathname: string;
      entries: readonly NatesclawRegisteredAgentDatabase[];
    }
  | undefined;

function resolveAgentDatabaseRegistryPath(options: NatesclawStateDatabaseOptions): string {
  return path.resolve(options.path ?? resolveNatesclawStateSqlitePath(options.env ?? process.env));
}

export function invalidateRegisteredAgentDatabasesMemo(
  options: NatesclawStateDatabaseOptions,
): void {
  const pathname = resolveAgentDatabaseRegistryPath(options);
  if (registeredAgentDatabasesMemo?.pathname === pathname) {
    registeredAgentDatabasesMemo = undefined;
  }
}

function cloneRegisteredAgentDatabases(
  entries: readonly NatesclawRegisteredAgentDatabase[],
): NatesclawRegisteredAgentDatabase[] {
  return entries.map((entry) => ({ ...entry }));
}

function hasUnavailableMissingSqlitePath(pathname: string): boolean {
  for (const candidate of resolveSqliteDatabaseFilePaths(pathname)) {
    try {
      lstatSync(candidate);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return true;
      }
    }
  }

  let ancestor = path.dirname(pathname);
  while (true) {
    try {
      const stat = lstatSync(ancestor);
      if (!stat.isSymbolicLink()) {
        return !stat.isDirectory();
      }
      try {
        return !statSync(ancestor).isDirectory();
      } catch {
        return true;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        return true;
      }
    }
    const parent = path.dirname(ancestor);
    if (parent === ancestor) {
      return false;
    }
    ancestor = parent;
  }
}

/** List agent databases recorded in the shared Natesclaw state registry. */
export function listNatesclawRegisteredAgentDatabases(
  options: NatesclawStateDatabaseOptions & {
    includeIncompatibleSchemaVersions?: boolean;
  } = {},
): NatesclawRegisteredAgentDatabase[] {
  const pathname = resolveAgentDatabaseRegistryPath(options);
  if (registeredAgentDatabasesMemo?.pathname === pathname) {
    const entries = cloneRegisteredAgentDatabases(registeredAgentDatabasesMemo.entries);
    return options.includeIncompatibleSchemaVersions
      ? entries
      : entries.filter((entry) => entry.schemaVersion === NATESCLAW_AGENT_SCHEMA_VERSION);
  }
  if (!existsSync(pathname)) {
    if (hasUnavailableMissingSqlitePath(pathname)) {
      throw new Error(`Natesclaw state database ${pathname} is unavailable.`);
    }
    registeredAgentDatabasesMemo = { pathname, entries: [] };
    return [];
  }
  // Discovery runs per row in list hot paths, so the legacy-schema gate and the
  // query share one process-held state handle instead of opening two
  // connections per call.
  const entries = withNatesclawStateDatabaseReadOnly(({ db: database }) => {
    if (detectNatesclawStateDatabaseSchemaMigrationsFromDatabase(database, pathname).length > 0) {
      throw new Error(
        `Natesclaw state database ${pathname} has a legacy agent database registry schema; run natesclaw doctor --fix to migrate it.`,
      );
    }
    const registryTable = database
      .prepare("SELECT type FROM sqlite_master WHERE name = 'agent_databases'")
      .get() as { type?: unknown } | undefined;
    if (!registryTable) {
      return [];
    }
    if (registryTable.type !== "table") {
      throw new Error(`Natesclaw state database ${pathname} has an invalid agent registry.`);
    }
    const db = getNodeSqliteKysely<NatesclawAgentRegistryDatabase>(database);
    const rows = executeSqliteQuerySync(
      database,
      db
        .selectFrom("agent_databases")
        .selectAll()
        .orderBy("agent_id", "asc")
        .orderBy("path", "asc"),
    ).rows;
    return rows.map((row) => ({
      agentId: normalizeAgentId(row.agent_id),
      path: row.path,
      schemaVersion: row.schema_version,
      lastSeenAt: row.last_seen_at,
      sizeBytes: row.size_bytes,
    }));
  }, options);
  registeredAgentDatabasesMemo = { pathname, entries };
  const cloned = cloneRegisteredAgentDatabases(entries);
  return options.includeIncompatibleSchemaVersions
    ? cloned
    : cloned.filter((entry) => entry.schemaVersion === NATESCLAW_AGENT_SCHEMA_VERSION);
}
