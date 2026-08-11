// Nostr API module exposes the plugin public contract.
export {
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  formatPairingApproveHint,
  type ChannelPlugin,
} from "natesclaw/plugin-sdk/channel-plugin-common";
export type { ChannelOutboundAdapter } from "natesclaw/plugin-sdk/channel-contract";
export {
  collectStatusIssuesFromLastError,
  createDefaultChannelRuntimeState,
} from "natesclaw/plugin-sdk/status-helpers";
