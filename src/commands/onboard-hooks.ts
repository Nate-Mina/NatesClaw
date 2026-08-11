/** Onboarding defaults for workspace hooks. */
import type { NatesclawConfig } from "../config/types.natesclaw.js";

const DEFAULT_ONBOARDING_INTERNAL_HOOKS = ["session-memory"] as const;

export function enableDefaultOnboardingInternalHooks(cfg: NatesclawConfig): NatesclawConfig {
  const existingInternal = cfg.hooks?.internal;
  if (existingInternal?.enabled === false) {
    return cfg;
  }

  let changed = false;
  const entries = { ...existingInternal?.entries };
  for (const hookName of DEFAULT_ONBOARDING_INTERNAL_HOOKS) {
    const entry = entries[hookName];
    if (entry?.enabled === false) {
      continue;
    }
    if (entry?.enabled !== true) {
      entries[hookName] = { ...entry, enabled: true };
      changed = true;
    }
  }

  if (!changed) {
    return cfg;
  }

  return {
    ...cfg,
    hooks: {
      ...cfg.hooks,
      internal: {
        ...existingInternal,
        entries,
      },
    },
  };
}
