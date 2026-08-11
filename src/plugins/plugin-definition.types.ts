import type { NatesclawPluginApi } from "./plugin-api.types.js";
import type { NatesclawPluginConfigSchema } from "./plugin-config-schema.types.js";
import type { PluginKind } from "./plugin-kind.types.js";
import type {
  NatesclawPluginReloadRegistration,
  NatesclawPluginSecurityAuditCollector,
} from "./plugin-registration.types.js";
import type { NatesclawPluginNodeHostCommand } from "./types.node-host.js";

/** Module-level plugin definition loaded from a native plugin entry file. */
export type NatesclawPluginDefinition = {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  /**
   * @deprecated Declare exclusive plugin kind in `natesclaw.plugin.json` via
   * manifest `kind`. Runtime-exported `kind` is kept as a compatibility
   * fallback for older plugins and may require loading plugin runtime on
   * metadata-only command paths.
   */
  kind?: PluginKind | PluginKind[];
  configSchema?: NatesclawPluginConfigSchema;
  reload?: NatesclawPluginReloadRegistration;
  nodeHostCommands?: NatesclawPluginNodeHostCommand[];
  securityAuditCollectors?: NatesclawPluginSecurityAuditCollector[];
  register?: (api: NatesclawPluginApi) => void;
};

export type NatesclawPluginModule = NatesclawPluginDefinition | ((api: NatesclawPluginApi) => void);
