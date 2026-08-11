// Matrix API module exposes the plugin public contract.
export {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  normalizeOptionalAccountId,
} from "natesclaw/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringArrayParam,
  readStringParam,
  ToolAuthorizationError,
} from "natesclaw/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "natesclaw/plugin-sdk/channel-config-schema";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/channel-core";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
  ChannelMessageToolDiscovery,
  ChannelOutboundAdapter,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelToolSend,
} from "natesclaw/plugin-sdk/channel-contract";
export {
  formatLocationText,
  toLocationContext,
  type NormalizedLocation,
} from "natesclaw/plugin-sdk/channel-inbound";
export { logInboundDrop } from "natesclaw/plugin-sdk/channel-inbound";
export { logTypingFailure } from "natesclaw/plugin-sdk/channel-outbound";
export { resolveAckReaction } from "natesclaw/plugin-sdk/channel-feedback";
export type { ChannelSetupInput } from "natesclaw/plugin-sdk/setup";
export type {
  NatesclawConfig,
  ContextVisibilityMode,
  DmPolicy,
  GroupPolicy,
} from "natesclaw/plugin-sdk/config-contracts";
export type { GroupToolPolicyConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { WizardPrompter } from "natesclaw/plugin-sdk/setup";
export type { SecretInput } from "natesclaw/plugin-sdk/secret-input";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export {
  addWildcardAllowFrom,
  formatDocsLink,
  hasConfiguredSecretInput,
  mergeAllowFromEntries,
  moveSingleAccountChannelSectionToDefaultAccount,
  promptAccountId,
  promptChannelAccessConfig,
  splitSetupEntries,
} from "natesclaw/plugin-sdk/setup";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export {
  assertHttpUrlTargetsPrivateNetwork,
  closeDispatcher,
  createPinnedDispatcher,
  isPrivateOrLoopbackHost,
  resolvePinnedHostnameWithPolicy,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
  type LookupFn,
  type SsrFPolicy,
} from "natesclaw/plugin-sdk/ssrf-runtime";
export {
  ensureConfiguredAcpBindingReady,
  resolveConfiguredAcpBindingRecord,
} from "natesclaw/plugin-sdk/acp-binding-runtime";
export {
  buildProbeChannelStatusSummary,
  collectStatusIssuesFromLastError,
  PAIRING_APPROVED_MESSAGE,
} from "natesclaw/plugin-sdk/channel-status";
export {
  getSessionBindingService,
  resolveThreadBindingIdleTimeoutMsForChannel,
  resolveThreadBindingMaxAgeMsForChannel,
} from "natesclaw/plugin-sdk/conversation-runtime";
export { resolveOutboundSendDep } from "natesclaw/plugin-sdk/channel-outbound";
export { resolveAgentIdFromSessionKey } from "natesclaw/plugin-sdk/routing";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export { loadOutboundMediaFromUrl } from "natesclaw/plugin-sdk/outbound-media";
export { normalizePollInput, type PollInput } from "natesclaw/plugin-sdk/poll-runtime";
export { writeJsonFileAtomically } from "natesclaw/plugin-sdk/json-store";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "natesclaw/plugin-sdk/channel-targets";
export { buildTimeoutAbortSignal } from "./matrix/sdk/timeout-abort-signal.js";
export { formatZonedTimestamp } from "natesclaw/plugin-sdk/time-runtime";
export type { PluginRuntime, RuntimeLogger } from "natesclaw/plugin-sdk/plugin-runtime";
export type { ReplyPayload } from "natesclaw/plugin-sdk/reply-runtime";
// resolveMatrixAccountStringValues already comes from the Matrix API barrel.
// Re-exporting auth-precedence here makes TS source loaders define the export twice.
