import type { NatesclawConfig } from "../../config/types.natesclaw.js";
import { markReplyConfigRuntimeMode } from "./reply-config-runtime-mode.js";

export function markCompleteReplyConfig<T extends NatesclawConfig>(
  config: T,
  options?: { runtimeMode?: "fast" | "full" },
): T {
  return markReplyConfigRuntimeMode(config, options?.runtimeMode ?? "fast");
}

export function withFastReplyConfig<T extends NatesclawConfig>(config: T): T {
  return markCompleteReplyConfig(config);
}
