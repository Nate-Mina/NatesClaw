import { chmodSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { resolveSqliteDatabaseFilePaths } from "../infra/sqlite-files.js";
import type { NatesclawAgentDatabaseOptions } from "./natesclaw-agent-db-contract.js";
import { resolveNatesclawAgentSqlitePath } from "./natesclaw-agent-db.paths.js";

const NATESCLAW_AGENT_DB_DIR_MODE = 0o700;
const NATESCLAW_AGENT_DB_FILE_MODE = 0o600;

export function ensureNatesclawAgentDatabasePermissions(
  pathname: string,
  options: NatesclawAgentDatabaseOptions,
): void {
  const dir = path.dirname(pathname);
  const defaultPath = resolveNatesclawAgentSqlitePath({
    agentId: options.agentId,
    env: options.env,
  });
  const isDefaultAgentDatabase = path.resolve(pathname) === path.resolve(defaultPath);
  const dirExisted = existsSync(dir);
  mkdirSync(dir, { recursive: true, mode: NATESCLAW_AGENT_DB_DIR_MODE });
  // Default agent state is private by contract; custom pre-existing dirs keep caller ownership.
  if (isDefaultAgentDatabase || !dirExisted) {
    chmodSync(dir, NATESCLAW_AGENT_DB_DIR_MODE);
  }
  for (const candidate of resolveSqliteDatabaseFilePaths(pathname)) {
    try {
      chmodSync(candidate, NATESCLAW_AGENT_DB_FILE_MODE);
    } catch (error) {
      // WAL/SHM/journal sidecars are transient: SQLite removes them at
      // checkpoint/close, so a concurrent worker can race this sweep. A
      // vanished sidecar needs no tightening; an existsSync guard would just
      // reintroduce the TOCTOU window.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
