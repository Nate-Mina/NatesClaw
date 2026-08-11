// Discord API module exposes the plugin public contract.
import type { NatesclawPluginApi } from "natesclaw/plugin-sdk/channel-plugin-common";
import { registerDiscordActivities as registerDiscordActivitiesImpl } from "./src/activities/register.js";

// Bundled entrypoints may not statically import ./src, so Activities registration
// is routed through this top-level barrel like the other Discord api surfaces.
export function registerDiscordActivities(api: NatesclawPluginApi): void {
  registerDiscordActivitiesImpl(api);
}
