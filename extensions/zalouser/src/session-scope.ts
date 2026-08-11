import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export function resolveZalouserDmSessionScope(config: NatesclawConfig) {
  const configured = config.session?.dmScope;
  return configured === "main" || !configured ? "per-channel-peer" : configured;
}
