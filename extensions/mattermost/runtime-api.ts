// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  NatesclawConfig,
  NatesclawPluginApi,
  PluginRuntime,
} from "natesclaw/plugin-sdk/core";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type { ReplyPayload } from "natesclaw/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "natesclaw/plugin-sdk/models-provider-runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "natesclaw/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "natesclaw/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "natesclaw/plugin-sdk/channel-status";
export { createAccountStatusSink } from "natesclaw/plugin-sdk/channel-outbound";
export {
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "natesclaw/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "natesclaw/plugin-sdk/models-provider-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "natesclaw/plugin-sdk/dangerous-name-runtime";
export { resolveStorePath } from "natesclaw/plugin-sdk/session-store-runtime";
export { formatInboundFromLabel } from "natesclaw/plugin-sdk/channel-inbound";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "natesclaw/plugin-sdk/outbound-media";
export { rawDataToString } from "natesclaw/plugin-sdk/webhook-ingress";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "natesclaw/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "natesclaw/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "natesclaw/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "natesclaw/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "natesclaw/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "natesclaw/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "natesclaw/plugin-sdk/media-runtime";
export { normalizeProviderId } from "natesclaw/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
