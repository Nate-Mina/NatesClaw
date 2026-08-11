// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  NatesclawConfig,
  NatesclawPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "natesclaw/plugin-sdk/core";
export type { NatesclawConfig as ClawdbotConfig } from "natesclaw/plugin-sdk/core";
export type RuntimeEnv = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};
export type { GroupToolPolicyConfig } from "natesclaw/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "natesclaw/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "natesclaw/plugin-sdk/channel-status";
export { createChannelPairingController } from "natesclaw/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "natesclaw/plugin-sdk/channel-outbound";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "natesclaw/plugin-sdk/context-visibility-runtime";
export { getSessionEntry } from "natesclaw/plugin-sdk/session-store-runtime";
export { readJsonFileWithFallback } from "natesclaw/plugin-sdk/json-store";
export { normalizeAgentId } from "natesclaw/plugin-sdk/routing";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "natesclaw/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
