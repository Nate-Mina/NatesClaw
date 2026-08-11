// State database path helpers resolve shared Natesclaw state DB paths.
import os from "node:os";
import path from "node:path";
import { isMainThread, threadId } from "node:worker_threads";
import { resolveStateDir } from "../config/paths.js";
import { parseStrictNonNegativeInteger } from "../infra/parse-finite-number.js";

/**
 * Path helpers for the shared Natesclaw SQLite state database.
 *
 * Tests get worker-scoped temp state roots unless they explicitly provide
 * `NATESCLAW_STATE_DIR`, which prevents parallel Vitest workers from sharing WAL files.
 */
function resolveNatesclawStateRootDir(env: NodeJS.ProcessEnv): string {
  if (env.NATESCLAW_STATE_DIR?.trim()) {
    return resolveStateDir(env);
  }
  if (env.VITEST || env.NODE_ENV === "test") {
    const workerId = parseStrictNonNegativeInteger(
      env.VITEST_WORKER_ID ?? env.VITEST_POOL_ID ?? "",
    );
    const shardSuffix =
      workerId !== undefined
        ? `${process.pid}-${workerId}`
        : isMainThread
          ? String(process.pid)
          : `${process.pid}-${threadId}`;
    return path.join(os.tmpdir(), "natesclaw-test-state", shardSuffix);
  }
  return resolveStateDir(env);
}

/** Resolve the directory that contains the shared state SQLite file. */
export function resolveNatesclawStateSqliteDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveNatesclawStateRootDir(env), "state");
}

/** Resolve the shared state SQLite file path. */
export function resolveNatesclawStateSqlitePath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveNatesclawStateSqliteDir(env), "natesclaw.sqlite");
}

/** Resolve the state owner directory for a canonical or explicit shared database path. */
export function resolveNatesclawStateDirForDatabasePath(databasePath: string): string {
  const databaseDir = path.dirname(path.resolve(databasePath));
  return path.basename(databaseDir) === "state" ? path.dirname(databaseDir) : databaseDir;
}
