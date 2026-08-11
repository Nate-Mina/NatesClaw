// Shared root CLI failure formatting with debug stack gating and recovery hints.
import { isTruthyEnvValue } from "../infra/env.js";
import { formatErrorMessage, formatUncaughtError } from "../infra/errors.js";
import { formatCliCommand } from "./command-format.js";

type FormatCliFailureOptions = {
  title: string;
  error: unknown;
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  includeDoctorHint?: boolean;
};

function hasDebugArg(argv: string[] | undefined): boolean {
  for (const arg of argv ?? []) {
    // Arguments after the terminator belong to the child, not root stack-trace policy.
    if (arg === "--") {
      return false;
    }
    if (arg === "--debug" || arg === "--verbose") {
      return true;
    }
  }
  return false;
}

function shouldShowStack(argv: string[] | undefined, env: NodeJS.ProcessEnv): boolean {
  return hasDebugArg(argv) || isTruthyEnvValue(env.NATESCLAW_DEBUG);
}

function pushPrefixed(out: string[], value: string): void {
  for (const line of value.split("\n")) {
    if (line.trim().length > 0) {
      out.push(`[natesclaw] ${line}`);
    }
  }
}

export function formatCliFailureLines(options: FormatCliFailureOptions): string[] {
  // Default output stays terse; stack traces require explicit debug intent.
  const env = options.env ?? process.env;
  const lines = [
    `[natesclaw] ${options.title}`,
    `[natesclaw] Reason: ${formatErrorMessage(options.error)}`,
  ];

  if (shouldShowStack(options.argv, env)) {
    lines.push("[natesclaw] Stack:");
    pushPrefixed(lines, formatUncaughtError(options.error));
  } else {
    lines.push("[natesclaw] Debug: set NATESCLAW_DEBUG=1 to include the stack trace.");
  }

  if (options.includeDoctorHint !== false) {
    lines.push(`[natesclaw] Try: ${formatCliCommand("natesclaw doctor", env)}`);
  }
  lines.push(`[natesclaw] Help: ${formatCliCommand("natesclaw --help", env)}`);
  return lines;
}
