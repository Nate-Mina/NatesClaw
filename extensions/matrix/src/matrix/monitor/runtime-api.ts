// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "natesclaw/plugin-sdk/channel-inbound";
export type { PluginRuntime, RuntimeLogger } from "natesclaw/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "natesclaw/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "natesclaw/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "natesclaw/plugin-sdk/channel-outbound";
export { formatLocationText, toLocationContext } from "natesclaw/plugin-sdk/channel-inbound";
export { getAgentScopedMediaLocalRoots } from "natesclaw/plugin-sdk/media-local-roots";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-outbound";
export { buildChannelKeyCandidates } from "natesclaw/plugin-sdk/channel-targets";
