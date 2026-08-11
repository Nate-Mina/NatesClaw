// Private runtime barrel for the bundled Nextcloud Talk extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { AllowlistMatch } from "natesclaw/plugin-sdk/allow-from";
export type { ChannelGroupContext } from "natesclaw/plugin-sdk/channel-contract";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyConfig,
  NatesclawConfig,
} from "natesclaw/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export type { OutboundReplyPayload } from "natesclaw/plugin-sdk/reply-payload";
export { deliverFormattedTextWithAttachments } from "natesclaw/plugin-sdk/reply-payload";
export type { PluginRuntime } from "natesclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type { SecretInput } from "natesclaw/plugin-sdk/secret-input";
export { fetchWithSsrFGuard } from "natesclaw/plugin-sdk/ssrf-runtime";
export { setNextcloudTalkRuntime } from "./src/runtime.js";
