// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export type { AllowlistMatch } from "natesclaw/plugin-sdk/allow-from";
export {
  mergeAllowlist,
  resolveAllowlistMatchSimple,
  summarizeMapping,
} from "natesclaw/plugin-sdk/allow-from";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelOutboundAdapter,
} from "natesclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/channel-core";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { resolveToolsBySender } from "natesclaw/plugin-sdk/channel-policy";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "natesclaw/plugin-sdk/channel-status";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "natesclaw/plugin-sdk/channel-targets";
export type {
  GroupPolicy,
  GroupToolPolicyConfig,
  MSTeamsChannelConfig,
  MSTeamsCloudName,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
  MarkdownTableMode,
  NatesclawConfig,
} from "natesclaw/plugin-sdk/config-contracts";
export { isDangerousNameMatchingEnabled } from "natesclaw/plugin-sdk/dangerous-name-runtime";
export { resolveDefaultGroupPolicy } from "natesclaw/plugin-sdk/runtime-group-policy";
export { withFileLock } from "natesclaw/plugin-sdk/file-lock";
export { keepHttpServerTaskAlive } from "natesclaw/plugin-sdk/channel-outbound";
export {
  detectMime,
  extensionForMime,
  extractOriginalFilename,
  getFileExtension,
  resolveChannelMediaMaxBytes,
} from "natesclaw/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "natesclaw/plugin-sdk/outbound-media";
// Deprecated media-legacy-projection surface; the re-export stays until the
// compat record's removeAfter window expires (deleted in retirement PR 4).
export { buildMediaPayload } from "natesclaw/plugin-sdk/reply-payload";
export type { ReplyPayload } from "natesclaw/plugin-sdk/reply-payload";
export type { PluginRuntime } from "natesclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type { SsrFPolicy } from "natesclaw/plugin-sdk/ssrf-runtime";
export { fetchWithSsrFGuard } from "natesclaw/plugin-sdk/ssrf-runtime";
export { normalizeStringEntries } from "natesclaw/plugin-sdk/string-normalization-runtime";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export { DEFAULT_WEBHOOK_MAX_BODY_BYTES } from "natesclaw/plugin-sdk/webhook-ingress";
export { setMSTeamsRuntime } from "./src/runtime.js";
