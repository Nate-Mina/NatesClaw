/**
 * Model fallback config fixture.
 *
 * Builds a minimal config with primary and fallback models for model-selection tests.
 */
import type { NatesclawConfig } from "../../config/types.natesclaw.js";

export function makeModelFallbackCfg(overrides: Partial<NatesclawConfig> = {}): NatesclawConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as NatesclawConfig;
}
