// Focused runtime contract for memory plugin config/state/helpers.

export type { AnyAgentTool } from "./host/natesclaw-runtime-agent.js";
export { resolveCronStyleNow } from "./host/natesclaw-runtime-agent.js";
export { DEFAULT_AGENT_COMPACTION_RESERVE_TOKENS_FLOOR } from "./host/natesclaw-runtime-agent.js";
export { resolveDefaultAgentId, resolveSessionAgentId } from "./host/natesclaw-runtime-agent.js";
export { resolveMemorySearchConfig } from "./host/natesclaw-runtime-agent.js";
export {
  asToolParamsRecord,
  jsonResult,
  readNumberParam,
  readStringParam,
} from "./host/natesclaw-runtime-agent.js";
export { SILENT_REPLY_TOKEN } from "./host/natesclaw-runtime-session.js";
export { parseNonNegativeByteSize } from "./host/natesclaw-runtime-config.js";
export {
  getRuntimeConfig,
  /** @deprecated Use getRuntimeConfig(), or pass the already loaded config through the call path. */
  loadConfig,
} from "./host/natesclaw-runtime-config.js";
export { resolveStateDir } from "./host/natesclaw-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/natesclaw-runtime-config.js";
export { emptyPluginConfigSchema } from "./host/natesclaw-runtime-memory.js";
export {
  buildActiveMemoryPromptSection,
  getMemoryCapabilityRegistration,
  listActiveMemoryPublicArtifacts,
} from "./host/natesclaw-runtime-memory.js";
export { parseAgentSessionKey } from "./host/natesclaw-runtime-agent.js";
export type { NatesclawConfig } from "./host/natesclaw-runtime-config.js";
export type { MemoryCitationsMode } from "./host/natesclaw-runtime-config.js";
export type {
  MemoryFlushPlan,
  MemoryFlushPlanResolver,
  MemoryPluginCapability,
  MemoryPluginPublicArtifact,
  MemoryPluginPublicArtifactsProvider,
  MemoryPluginRuntime,
  MemoryPromptSectionBuilder,
} from "./host/natesclaw-runtime-memory.js";
export type { NatesclawPluginApi } from "./host/natesclaw-runtime-memory.js";
