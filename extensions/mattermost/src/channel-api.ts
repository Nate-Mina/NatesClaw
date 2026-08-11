// Mattermost API module exposes the plugin public contract.
export { createAccountStatusSink } from "natesclaw/plugin-sdk/channel-outbound";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/core";
export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/core";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";
