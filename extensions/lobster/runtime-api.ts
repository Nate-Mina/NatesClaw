// Lobster API module exposes the plugin public contract.
export { definePluginEntry } from "natesclaw/plugin-sdk/core";
export type {
  AnyAgentTool,
  NatesclawPluginApi,
  NatesclawPluginToolContext,
  NatesclawPluginToolFactory,
} from "natesclaw/plugin-sdk/core";
export {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "natesclaw/plugin-sdk/windows-spawn";
