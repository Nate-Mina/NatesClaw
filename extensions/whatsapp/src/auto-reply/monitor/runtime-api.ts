// Whatsapp API module exposes the plugin public contract.
export { resolveIdentityNamePrefix } from "natesclaw/plugin-sdk/agent-runtime";
export { formatInboundEnvelope } from "natesclaw/plugin-sdk/channel-inbound";
export { resolveInboundSessionEnvelopeContext } from "natesclaw/plugin-sdk/channel-inbound";
export { createChannelMessageReplyPipeline } from "natesclaw/plugin-sdk/channel-outbound";
export {
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "natesclaw/plugin-sdk/command-detection";
export { resolveChannelContextVisibilityMode } from "../config.runtime.js";
export { getAgentScopedMediaLocalRoots } from "natesclaw/plugin-sdk/media-runtime";
export type LoadConfigFn = typeof import("../config.runtime.js").getRuntimeConfig;
export {
  buildHistoryContextFromEntries,
  type HistoryEntry,
} from "natesclaw/plugin-sdk/reply-history";
export { resolveSendableOutboundReplyParts } from "natesclaw/plugin-sdk/reply-payload";
export {
  resolveChunkMode,
  resolveTextChunkLimit,
  type getReplyFromConfig,
  type ReplyPayload,
} from "natesclaw/plugin-sdk/reply-runtime";
export {
  resolveInboundLastRouteSessionKey,
  type resolveAgentRoute,
} from "natesclaw/plugin-sdk/routing";
export { logVerbose, shouldLogVerbose, type getChildLogger } from "natesclaw/plugin-sdk/runtime-env";
export { resolvePinnedMainDmOwnerFromAllowlist } from "natesclaw/plugin-sdk/security-runtime";
export { resolveMarkdownTableMode } from "natesclaw/plugin-sdk/markdown-table-runtime";
export { jidToE164, normalizeE164 } from "../../text-runtime.js";
