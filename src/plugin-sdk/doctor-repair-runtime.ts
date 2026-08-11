/**
 * Heavy doctor repair operations: plugin install-path diagnosis, plugin config
 * removal, and Natesclaw state-database schema detection/repair.
 *
 * These pull the state-database and plugin-registry graphs, so they are kept off
 * `runtime-doctor-migrations` (the dependency-light subpath doctor contract
 * closures import). Doctor enumeration cold-loads those closures per plugin;
 * only code that actually performs a repair should reach this subpath, and
 * closure-resident callers must import it lazily.
 */

export {
  detectPluginInstallPathIssue,
  formatPluginInstallPathIssue,
} from "../infra/plugin-install-path-warnings.js";
export { removePluginFromConfig } from "../plugins/uninstall-config.js";
export {
  detectNatesclawStateDatabaseSchemaMigrations,
  repairNatesclawStateDatabaseSchema,
} from "../state/natesclaw-state-db.js";
export type { NatesclawStateDatabaseSchemaMigration } from "../state/natesclaw-state-db.js";
