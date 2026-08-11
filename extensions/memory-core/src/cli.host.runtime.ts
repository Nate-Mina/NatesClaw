// Memory Core plugin module implements cli.host behavior.
export {
  defaultRuntime,
  formatErrorMessage,
  resolveCommandSecretRefsViaGateway,
  setVerbose,
  shortenHomeInString,
  shortenHomePath,
  theme,
  withManager,
  withProgress,
  withProgressTotals,
} from "natesclaw/plugin-sdk/memory-core-host-runtime-cli";
export {
  getRuntimeConfig,
  resolveDefaultAgentId,
  resolveSessionTranscriptsDirForAgent,
  resolveStateDir,
  type NatesclawConfig,
} from "natesclaw/plugin-sdk/memory-core-host-runtime-core";
export {
  listMemoryFiles,
  normalizeExtraMemoryPaths,
} from "natesclaw/plugin-sdk/memory-core-host-runtime-files";
export { getMemorySearchManager } from "./memory/index.js";
