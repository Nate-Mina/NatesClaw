// Qqbot API module exposes the plugin public contract.
export type { ChannelPlugin, NatesclawPluginApi, PluginRuntime } from "natesclaw/plugin-sdk/core";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type {
  NatesclawPluginService,
  NatesclawPluginServiceContext,
  PluginLogger,
} from "natesclaw/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
