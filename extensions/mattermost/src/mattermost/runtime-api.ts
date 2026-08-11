// Mattermost API module exposes the plugin public contract.
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChatType,
  HistoryEntry,
  NatesclawConfig,
  NatesclawPluginApi,
  ReplyPayload,
} from "natesclaw/plugin-sdk/core";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export { resolveAllowlistMatchSimple } from "natesclaw/plugin-sdk/allow-from";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-feedback";
export { listSkillCommandsForAgents } from "natesclaw/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "natesclaw/plugin-sdk/models-provider-runtime";
export { isDangerousNameMatchingEnabled } from "natesclaw/plugin-sdk/dangerous-name-runtime";
export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { resolveChannelMediaMaxBytes } from "natesclaw/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "natesclaw/plugin-sdk/outbound-media";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
} from "natesclaw/plugin-sdk/reply-history";
export { registerPluginHttpRoute } from "natesclaw/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "natesclaw/plugin-sdk/webhook-ingress";
export { isTrustedProxyAddress, resolveClientIp } from "natesclaw/plugin-sdk/core";
export { parseTcpPort } from "natesclaw/plugin-sdk/number-runtime";
