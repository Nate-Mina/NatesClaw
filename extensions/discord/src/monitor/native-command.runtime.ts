import { dispatchChannelInboundTurn } from "natesclaw/plugin-sdk/channel-inbound";
// Discord plugin module implements native command behavior.
import { resolveDirectStatusReplyForSession } from "natesclaw/plugin-sdk/command-status-runtime";
import { getSessionEntry } from "natesclaw/plugin-sdk/session-store-runtime";
import { resolveDiscordNativeInteractionRouteState } from "./native-command-route.js";

export const nativeCommandRuntime = {
  dispatchChannelInboundTurn,
  resolveDirectStatusReplyForSession,
  resolveDiscordNativeInteractionRouteState,
  getSessionEntry,
};
