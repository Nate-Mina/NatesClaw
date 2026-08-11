import type { NatesclawConfig } from "../../config/types.natesclaw.js";

// Reply completeness is process-local metadata. Keep it off config objects so
// frozen runtime snapshots and identity-keyed caches remain valid.
const replyConfigRuntimeModes = new WeakMap<NatesclawConfig, "fast" | "full">();

export function markReplyConfigRuntimeMode<T extends NatesclawConfig>(
  config: T,
  runtimeMode: "fast" | "full",
): T {
  replyConfigRuntimeModes.set(config, runtimeMode);
  return config;
}

export function isCompleteReplyConfig(config: unknown): config is NatesclawConfig {
  return Boolean(
    config && typeof config === "object" && replyConfigRuntimeModes.has(config as NatesclawConfig),
  );
}

export function usesFullReplyRuntime(config: unknown): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }
  const mode = replyConfigRuntimeModes.get(config as NatesclawConfig);
  return mode === "full";
}
