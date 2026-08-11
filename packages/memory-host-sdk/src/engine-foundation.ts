// Real workspace contract for memory engine foundation concerns.

export {
  resolveAgentContextLimits,
  resolveAgentDir,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId,
  resolveSessionAgentId,
} from "./host/natesclaw-runtime-agent.js";
export {
  resolveMemorySearchConfig,
  resolveMemorySearchSyncConfig,
  type ResolvedMemorySearchConfig,
  type ResolvedMemorySearchSyncConfig,
} from "./host/natesclaw-runtime-agent.js";
export { parseDurationMs } from "./host/natesclaw-runtime-config.js";
export { loadConfig } from "./host/natesclaw-runtime-config.js";
export { resolveStateDir } from "./host/natesclaw-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/natesclaw-runtime-config.js";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
} from "./host/natesclaw-runtime-config.js";
export { root } from "./host/natesclaw-runtime-io.js";
export { isPathInside } from "./host/fs-utils.js";
export { createSubsystemLogger } from "./host/natesclaw-runtime-io.js";
export { detectMime } from "./host/natesclaw-runtime-io.js";
export { resolveGlobalSingleton } from "./host/natesclaw-runtime-io.js";
export { onSessionTranscriptUpdate } from "./host/natesclaw-runtime-session.js";
export { splitShellArgs } from "./host/natesclaw-runtime-io.js";
export { runTasksWithConcurrency } from "./host/natesclaw-runtime-io.js";
export {
  shortenHomeInString,
  shortenHomePath,
  resolveUserPath,
  truncateUtf16Safe,
} from "./host/natesclaw-runtime-io.js";
export type { NatesclawConfig } from "./host/natesclaw-runtime-config.js";
export type { SecretInput } from "./host/natesclaw-runtime-config.js";
export type { MemoryCitationsMode } from "./host/natesclaw-runtime-config.js";
export type { MemorySearchConfig } from "./host/natesclaw-runtime-config.js";
