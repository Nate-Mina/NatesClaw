// Slack API module exposes the plugin public contract.
export {
  buildComputedAccountStatusSnapshot,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromRequiredCredentialStatuses,
} from "natesclaw/plugin-sdk/channel-status";
export { buildChannelConfigSchema, SlackConfigSchema } from "../config-api.js";
export type { ChannelMessageActionContext } from "natesclaw/plugin-sdk/channel-contract";
export { DEFAULT_ACCOUNT_ID } from "natesclaw/plugin-sdk/account-id";
export type {
  ChannelPlugin,
  NatesclawPluginApi,
  PluginRuntime,
} from "natesclaw/plugin-sdk/channel-plugin-common";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { SlackAccountConfig } from "natesclaw/plugin-sdk/config-contracts";
export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
} from "natesclaw/plugin-sdk/channel-plugin-common";
export { loadOutboundMediaFromUrl } from "natesclaw/plugin-sdk/outbound-media";
export { looksLikeSlackTargetId, normalizeSlackMessagingTarget } from "./target-parsing.js";
export { getChatChannelMeta } from "./channel-api.js";
export {
  createActionGate,
  imageResultFromFile,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringParam,
  withNormalizedTimestamp,
} from "natesclaw/plugin-sdk/channel-actions";
