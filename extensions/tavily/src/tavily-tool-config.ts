// Tavily helper module supports tavily tool config behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import type { NatesclawPluginToolContext } from "natesclaw/plugin-sdk/plugin-entry";
import type { NatesclawPluginApi } from "natesclaw/plugin-sdk/plugin-runtime";

export type TavilyToolConfigContext = Pick<
  NatesclawPluginToolContext,
  "config" | "runtimeConfig" | "getRuntimeConfig"
>;

export function resolveTavilyToolConfig(
  api: NatesclawPluginApi,
  ctx?: TavilyToolConfigContext,
): NatesclawConfig {
  return ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
}
