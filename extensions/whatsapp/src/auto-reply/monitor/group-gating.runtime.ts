// Whatsapp plugin module implements group gating behavior.
export {
  implicitMentionKindWhen,
  resolveInboundMentionDecision,
} from "natesclaw/plugin-sdk/channel-mention-gating";
export { hasControlCommand } from "natesclaw/plugin-sdk/command-detection";
export { createChannelHistoryWindow } from "natesclaw/plugin-sdk/reply-history";
export { parseActivationCommand } from "natesclaw/plugin-sdk/group-activation";
export { normalizeE164 } from "../../text-runtime.js";
