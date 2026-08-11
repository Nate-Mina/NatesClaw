// Irc API module exposes the plugin public contract.
export { createAccountStatusSink } from "natesclaw/plugin-sdk/channel-outbound";
export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/channel-core";
export { PAIRING_APPROVED_MESSAGE } from "natesclaw/plugin-sdk/channel-status";
export { buildBaseChannelStatusSummary } from "natesclaw/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
