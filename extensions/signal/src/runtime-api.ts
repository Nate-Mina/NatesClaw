// Private runtime barrel for the bundled Signal extension.
// Prefer narrower SDK subpaths plus local extension seams over the legacy signal barrel.

export type { ChannelMessageActionAdapter } from "natesclaw/plugin-sdk/channel-contract";
export { buildChannelConfigSchema, SignalConfigSchema } from "../config-api.js";
export { PAIRING_APPROVED_MESSAGE } from "natesclaw/plugin-sdk/channel-status";
import type { NatesclawConfig as RuntimeNatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { RuntimeNatesclawConfig as NatesclawConfig };
export type { NatesclawPluginApi, PluginRuntime } from "natesclaw/plugin-sdk/core";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/core";
export {
  DEFAULT_ACCOUNT_ID,
  applyAccountNameToChannelSection,
  deleteAccountFromConfigSection,
  emptyPluginConfigSchema,
  formatPairingApproveHint,
  getChatChannelMeta,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  setAccountEnabledInConfigSection,
} from "natesclaw/plugin-sdk/core";
export { resolveChannelMediaMaxBytes } from "natesclaw/plugin-sdk/media-runtime";
export { formatCliCommand, formatDocsLink } from "natesclaw/plugin-sdk/setup-tools";
export { chunkText } from "natesclaw/plugin-sdk/reply-runtime";
export { detectBinary } from "natesclaw/plugin-sdk/setup-tools";
export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
} from "natesclaw/plugin-sdk/runtime-group-policy";
export {
  buildBaseAccountStatusSnapshot,
  buildBaseChannelStatusSummary,
  collectStatusIssuesFromLastError,
  createDefaultChannelRuntimeState,
} from "natesclaw/plugin-sdk/status-helpers";
export { normalizeE164 } from "natesclaw/plugin-sdk/text-utility-runtime";
export { looksLikeSignalTargetId, normalizeSignalMessagingTarget } from "./normalize.js";
export {
  listEnabledSignalAccounts,
  listSignalAccountIds,
  resolveDefaultSignalAccountId,
  resolveSignalAccount,
  resolveSignalTransport,
} from "./accounts.js";
export { monitorSignalProvider } from "./monitor.js";
export { installSignalCli } from "./install-signal-cli.js";
export { probeSignal } from "./probe.js";
export { resolveSignalReactionLevel } from "./reaction-level.js";
export { removeReactionSignal, sendReactionSignal } from "./send-reactions.js";
export { sendMessageSignal } from "./send.js";
export { signalMessageActions } from "./message-actions.js";
export type { ResolvedSignalAccount, ResolvedSignalTransport } from "./accounts.js";
export type { SignalAccountConfig, SignalTransportConfig } from "./account-types.js";
