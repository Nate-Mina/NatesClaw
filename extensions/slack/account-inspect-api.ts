// Slack API module exposes the plugin public contract.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: NatesclawConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
