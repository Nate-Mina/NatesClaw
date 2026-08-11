// Discord API module exposes the plugin public contract.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: NatesclawConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
