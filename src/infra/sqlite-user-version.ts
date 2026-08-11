import { NATESCLAW_DATABASE_SCHEMA_DOCS_URL } from "../state/natesclaw-state-db-contract.js";
import { VERSION } from "../version.js";
import { resolveCommitHash } from "./git-commit.js";
import { resolveNatesclawPackageRootSync } from "./natesclaw-root.js";

type SqliteUserVersionReader = {
  prepare: (sql: string) => { get: () => unknown };
};

export function readSqliteUserVersion(db: SqliteUserVersionReader): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version?: unknown } | undefined;
  return Number(row?.user_version ?? 0);
}

/**
 * Name the refusing install the way `--version` does, plus the root it runs from.
 * The path is the only part an operator can always act on: one release version
 * string spans many commits, and a linked source checkout reports its git HEAD
 * even when the built output actually executing is older.
 */
export function describeRunningNatesclawBuild(): string {
  const moduleUrl = import.meta.url;
  const commit = resolveCommitHash({ moduleUrl });
  const root = resolveNatesclawPackageRootSync({ moduleUrl });
  const identity = commit ? `Natesclaw ${VERSION} (${commit})` : `Natesclaw ${VERSION}`;
  return root ? `${identity} installed at ${root}` : identity;
}

export function createNewerSqliteSchemaVersionError(
  databaseLabel: string,
  pathname: string,
  schemaVersion: number,
  supportedVersion: number,
): Error {
  const error = new Error(
    `${databaseLabel} ${pathname} uses newer schema version ${schemaVersion}; this build supports ${supportedVersion}. ` +
      `Refused by ${describeRunningNatesclawBuild()}. ` +
      "Identify installs by that path: one version string spans many builds, and a linked source checkout reports its git HEAD even when its built output is older. " +
      `Run a build that supports schema ${schemaVersion} or newer against this state directory — rebuild or update the install above — or point this build at a different NATESCLAW_STATE_DIR. ` +
      `See ${NATESCLAW_DATABASE_SCHEMA_DOCS_URL}.`,
  );
  error.name = "SqliteSchemaVersionError";
  return error;
}
