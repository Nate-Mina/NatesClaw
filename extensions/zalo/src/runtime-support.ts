// Zalo plugin module implements runtime support behavior.
export type { ReplyPayload } from "natesclaw/plugin-sdk/reply-runtime";
export type { NatesclawConfig, GroupPolicy } from "natesclaw/plugin-sdk/config-contracts";
export type { MarkdownTableMode } from "natesclaw/plugin-sdk/config-contracts";
export type { BaseTokenResolution } from "natesclaw/plugin-sdk/channel-contract";
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "natesclaw/plugin-sdk/channel-contract";
export type { SecretInput } from "natesclaw/plugin-sdk/secret-input";
export type { ChannelPlugin, PluginRuntime, WizardPrompter } from "natesclaw/plugin-sdk/core";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type { OutboundReplyPayload } from "natesclaw/plugin-sdk/reply-payload";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  formatPairingApproveHint,
  jsonResult,
  normalizeAccountId,
  readStringParam,
  resolveClientIp,
} from "natesclaw/plugin-sdk/core";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  buildSingleChannelSecretPromptState,
  mergeAllowFromEntries,
  migrateBaseNameToDefaultAccount,
  promptSingleChannelSecretInput,
  runSingleChannelSecretStep,
  setTopLevelChannelDmPolicyWithAllowFrom,
} from "natesclaw/plugin-sdk/setup";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "natesclaw/plugin-sdk/secret-input";
export {
  buildTokenChannelStatusSummary,
  PAIRING_APPROVED_MESSAGE,
} from "natesclaw/plugin-sdk/channel-status";
export { buildBaseAccountStatusSnapshot } from "natesclaw/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export {
  formatAllowFromLowercase,
  isNormalizedSenderAllowed,
} from "natesclaw/plugin-sdk/allow-from";
export { addWildcardAllowFrom } from "natesclaw/plugin-sdk/setup";
export { resolveOpenProviderRuntimeGroupPolicy } from "natesclaw/plugin-sdk/runtime-group-policy";
export {
  warnMissingProviderGroupPolicyFallbackOnce,
  resolveDefaultGroupPolicy,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-feedback";
export {
  deliverTextOrMediaReply,
  isNumericTargetId,
  sendPayloadWithChunkedTextAndMedia,
} from "natesclaw/plugin-sdk/reply-payload";
export { waitForAbortSignal } from "natesclaw/plugin-sdk/runtime";
export {
  applyBasicWebhookRequestGuards,
  createFixedWindowRateLimiter,
  createWebhookAnomalyTracker,
  readJsonWebhookBodyOrReject,
  registerPluginHttpRoute,
  registerWebhookTarget,
  registerWebhookTargetWithPluginRoute,
  resolveWebhookPath,
  resolveWebhookTargetWithAuthOrRejectSync,
  WEBHOOK_ANOMALY_COUNTER_DEFAULTS,
  WEBHOOK_RATE_LIMIT_DEFAULTS,
  withResolvedWebhookRequestPipeline,
} from "natesclaw/plugin-sdk/webhook-ingress";
export type {
  RegisterWebhookPluginRouteOptions,
  RegisterWebhookTargetOptions,
} from "natesclaw/plugin-sdk/webhook-ingress";
