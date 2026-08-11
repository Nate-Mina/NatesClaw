// Diffs API module exposes the plugin public contract.
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export {
  definePluginEntry,
  type AnyAgentTool,
  type NatesclawPluginApi,
  type NatesclawPluginConfigSchema,
  type NatesclawPluginToolContext,
  type PluginLogger,
} from "natesclaw/plugin-sdk/plugin-entry";
export { resolvePreferredNatesclawTmpDir } from "natesclaw/plugin-sdk/temp-path";
