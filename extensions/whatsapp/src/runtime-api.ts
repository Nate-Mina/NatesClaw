// Whatsapp API module exposes the plugin public contract.
export { getChatChannelMeta, type ChannelPlugin } from "natesclaw/plugin-sdk/core";
export { buildChannelConfigSchema, WhatsAppConfigSchema } from "../config-api.js";
export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export {
  formatWhatsAppConfigAllowFromEntries,
  resolveWhatsAppConfigAllowFrom,
  resolveWhatsAppConfigDefaultTo,
} from "./config-accessors.js";
export {
  createActionGate,
  jsonResult,
  readReactionParams,
  readStringParam,
  ToolAuthorizationError,
} from "natesclaw/plugin-sdk/channel-actions";
export { normalizeE164 } from "natesclaw/plugin-sdk/account-resolution";
export type { DmPolicy, GroupPolicy } from "natesclaw/plugin-sdk/config-contracts";
import type { NatesclawConfig as RuntimeNatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import { loadWhatsAppChannelRuntime } from "./channel-runtime-loader.js";

export { type ChannelMessageActionName } from "natesclaw/plugin-sdk/channel-contract";
export {
  resolveWhatsAppGroupRequireMention,
  resolveWhatsAppGroupToolPolicy,
} from "./group-policy.js";
export { resolveWhatsAppMentionStripRegexes } from "./group-intro.js";
export { createWhatsAppOutboundBase } from "./outbound-base.js";
export {
  isWhatsAppGroupJid,
  isWhatsAppUserTarget,
  looksLikeWhatsAppTargetId,
  normalizeWhatsAppAllowFromEntries,
  normalizeWhatsAppMessagingTarget,
  normalizeWhatsAppTarget,
} from "./normalize-target.js";
export { resolveWhatsAppOutboundTarget } from "./resolve-outbound-target.js";
export { resolveWhatsAppReactionLevel } from "./reaction-level.js";

export type NatesclawConfig = RuntimeNatesclawConfig;
export type { WhatsAppAccountConfig } from "./account-types.js";

type MonitorWebChannel = typeof import("./channel.runtime.js").monitorWebChannel;

export async function monitorWebChannel(
  ...args: Parameters<MonitorWebChannel>
): ReturnType<MonitorWebChannel> {
  const { monitorWebChannel: monitorWebChannelLocal } = await loadWhatsAppChannelRuntime();
  return await monitorWebChannelLocal(...args);
}
