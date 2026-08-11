// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "natesclaw/plugin-sdk/channel-actions";
export { buildChannelConfigSchema, GoogleChatConfigSchema } from "./config-api.js";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "natesclaw/plugin-sdk/channel-contract";
export { missingTargetError } from "natesclaw/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "natesclaw/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { PAIRING_APPROVED_MESSAGE } from "natesclaw/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "natesclaw/plugin-sdk/dangerous-name-runtime";
export type { PluginRuntime } from "natesclaw/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "natesclaw/plugin-sdk/ssrf-runtime";
export type {
  GoogleChatAccountConfig,
  GoogleChatConfig,
} from "natesclaw/plugin-sdk/config-contracts";
export { extractToolSend } from "natesclaw/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "natesclaw/plugin-sdk/channel-inbound";
export { resolveWebhookPath } from "natesclaw/plugin-sdk/webhook-ingress";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "natesclaw/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "natesclaw/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
