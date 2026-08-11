// Discord helper module supports runtime config behavior.
import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
  selectApplicableRuntimeConfig,
} from "natesclaw/plugin-sdk/runtime-config-snapshot";
import type { NatesclawConfig } from "./runtime-api.js";

export function selectDiscordRuntimeConfig(inputConfig: NatesclawConfig): NatesclawConfig {
  return (
    selectApplicableRuntimeConfig({
      inputConfig,
      runtimeConfig: getRuntimeConfigSnapshot(),
      runtimeSourceConfig: getRuntimeConfigSourceSnapshot(),
    }) ?? inputConfig
  );
}
