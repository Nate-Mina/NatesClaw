// Formats Natesclaw CLI command snippets for chat-facing command responses.
import { resolveCurrentNatesclawCliInvocation } from "../../infra/natesclaw-cli-invocation.js";

const TEST_RUNNER_ENV_PREFIXES = ["VITEST_", "NATESCLAW_VITEST_"];

function quoteShellArg(value: string): string {
  if (process.platform === "win32") {
    return `'${value.replaceAll("'", "''")}'`;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** Reconstructs the current Natesclaw CLI invocation with extra args. */
export function buildCurrentNatesclawCliArgv(args: string[]): string[] {
  const invocation = resolveCurrentNatesclawCliInvocation(args);
  return [invocation.command, ...invocation.args];
}

/** Clears test-runner env inherited by harness-hosted gateways before spawning the CLI. */
export function buildCurrentNatesclawCliExecEnv(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> | undefined {
  const overrides: Record<string, string> = {};
  for (const key of Object.keys(env)) {
    if (key === "VITEST" || TEST_RUNNER_ENV_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      overrides[key] = "";
    }
  }
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

/** Builds a shell-quoted command string for rerunning the current Natesclaw CLI. */
export function buildCurrentNatesclawCliCommand(args: string[]): string {
  return buildCurrentNatesclawCliArgv(args).map(quoteShellArg).join(" ");
}
