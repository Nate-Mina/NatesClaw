// Config-facing runtime facade for memory host packages.
// This keeps memory plugins off broader core config modules and their private helpers.
export {
  getRuntimeConfig,
  hasConfiguredSecretInput,
  loadConfig,
  normalizeResolvedSecretInputString,
  parseDurationMs,
  parseNonNegativeByteSize,
  resolveSessionTranscriptsDirForAgent,
  resolveStateDir,
} from "./natesclaw-runtime.js";
export type {
  MemoryCitationsMode,
  MemorySearchConfig,
  NatesclawConfig,
  SecretInput,
} from "./natesclaw-runtime.js";
