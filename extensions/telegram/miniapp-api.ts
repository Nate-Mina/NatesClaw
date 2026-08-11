import type { NatesclawPluginApi } from "natesclaw/plugin-sdk/plugin-entry";
import { registerTelegramMiniAppCommand } from "./src/miniapp/command.js";
import { createTelegramMiniAppLaunchTickets } from "./src/miniapp/launch-ticket.js";
import { registerTelegramMiniAppRoutes } from "./src/miniapp/routes.js";

export function registerTelegramMiniApp(api: NatesclawPluginApi): void {
  const launchTickets = createTelegramMiniAppLaunchTickets();
  registerTelegramMiniAppRoutes(api, launchTickets);
  registerTelegramMiniAppCommand(api, launchTickets);
}
