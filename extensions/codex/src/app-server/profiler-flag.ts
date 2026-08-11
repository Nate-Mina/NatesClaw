/**
 * Resolves whether Codex app-server profiling instrumentation is enabled by
 * Natesclaw diagnostic flags.
 */
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import { isDiagnosticFlagEnabled } from "natesclaw/plugin-sdk/diagnostic-runtime";

const PROFILER_FLAGS = ["profiler", "codex.profiler"] as const;

/** Checks the generic and Codex-specific profiler diagnostic flags. */
export function isCodexAppServerProfilerEnabled(
  config?: NatesclawConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return PROFILER_FLAGS.some((flag) => isDiagnosticFlagEnabled(flag, config, env));
}
