// Discord plugin module implements security doctor behavior.
import { buildMutableAllowEntryDetector } from "natesclaw/plugin-sdk/channel-policy";

export const isDiscordMutableAllowEntry = buildMutableAllowEntryDetector({
  stableIdPattern: /^(?:\d+|<@!?\d+>|(?:discord|user|pk):.+)$/,
});
