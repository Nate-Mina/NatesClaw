import type { NatesclawConfig } from "natesclaw/plugin-sdk/memory-core-host-engine-foundation";

export function isolateMemoryManagerTestConfig(cfg: NatesclawConfig): NatesclawConfig {
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      enabled: cfg.plugins?.enabled ?? false,
    },
  };
}
