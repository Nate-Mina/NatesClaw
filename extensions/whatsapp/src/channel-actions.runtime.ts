// Whatsapp plugin module implements channel actions behavior.
import { createActionGate } from "natesclaw/plugin-sdk/channel-actions";
import type { ChannelMessageActionName } from "natesclaw/plugin-sdk/channel-contract";
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export { listWhatsAppAccountIds, resolveWhatsAppAccount } from "./accounts.js";
export { resolveWhatsAppReactionLevel } from "./reaction-level.js";
export { createActionGate, type ChannelMessageActionName, type NatesclawConfig };
