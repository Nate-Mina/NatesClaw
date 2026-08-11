// Slack plugin module implements security doctor behavior.
import { buildMutableAllowEntryDetector } from "natesclaw/plugin-sdk/channel-policy";

export const isSlackMutableAllowEntry = buildMutableAllowEntryDetector({
  stableIdPattern:
    /^(?:(?:(?:[sS][lL][aA][cC][kK]|[uU][sS][eE][rR]):)?(?:[UWBCGDT][A-Z0-9]{2,}|[A-Za-z0-9]{8,})|<@[A-Za-z0-9]{8,}>)$/,
});
