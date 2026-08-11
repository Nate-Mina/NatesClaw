// Imessage API module exposes the plugin public contract.
import { formatTrimmedAllowFromEntries } from "natesclaw/plugin-sdk/channel-config-helpers";
import { PAIRING_APPROVED_MESSAGE } from "natesclaw/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
} from "natesclaw/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "natesclaw/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "natesclaw/plugin-sdk/status-helpers";
import { normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "natesclaw/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
};

export type { ChannelPlugin };
