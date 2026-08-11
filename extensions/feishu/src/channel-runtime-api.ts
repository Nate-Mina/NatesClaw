// Feishu API module exposes the plugin public contract.
export type {
  ChannelMessageActionName,
  ChannelMeta,
  ChannelPlugin,
  ClawdbotConfig,
} from "../runtime-api.js";

export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-resolution";
export { createActionGate } from "natesclaw/plugin-sdk/channel-actions";
export {
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "natesclaw/plugin-sdk/status-helpers";
export { PAIRING_APPROVED_MESSAGE } from "natesclaw/plugin-sdk/channel-status";
