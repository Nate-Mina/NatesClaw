// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "natesclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/channel-core";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { PluginRuntime } from "natesclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "natesclaw/plugin-sdk/config-contracts";
export type { OutboundReplyPayload } from "natesclaw/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "natesclaw/plugin-sdk/channel-config-schema";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "natesclaw/plugin-sdk/channel-status";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "natesclaw/plugin-sdk/channel-outbound";
export { resolveControlCommandGate } from "natesclaw/plugin-sdk/command-auth-native";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "natesclaw/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "natesclaw/plugin-sdk/dangerous-name-runtime";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
