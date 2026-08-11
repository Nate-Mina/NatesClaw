/**
 * Session config fixtures.
 *
 * Shared builders for agent/session tests that need configured session scope.
 */
import type { NatesclawConfig } from "../../config/types.natesclaw.js";

/** Builds a per-sender session config with optional targeted overrides. */
export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<NatesclawConfig["session"]>> = {},
): NonNullable<NatesclawConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
