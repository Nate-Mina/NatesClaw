// Msteams plugin module implements user agent behavior.
import { createRequire } from "node:module";
import { getMSTeamsRuntime } from "./runtime.js";

let cachedUserAgent: string | undefined;

function resolveTeamsSdkVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("@microsoft/teams.apps/package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function resolveNatesclawVersion(): string {
  try {
    return getMSTeamsRuntime().version;
  } catch {
    return "unknown";
  }
}

/**
 * Build a combined User-Agent string that preserves the Teams SDK identity
 * and appends the Natesclaw version.
 *
 * Format: "teams.ts[apps]/<sdk-version> Natesclaw/<natesclaw-version>"
 * Example: "teams.ts[apps]/2.0.5 Natesclaw/2026.3.22"
 *
 * This lets the Teams backend track SDK usage while also identifying the
 * host application.
 */
export function buildUserAgent(): string {
  if (cachedUserAgent) {
    return cachedUserAgent;
  }
  cachedUserAgent = `teams.ts[apps]/${resolveTeamsSdkVersion()} Natesclaw/${resolveNatesclawVersion()}`;
  return cachedUserAgent;
}

/**
 * User-Agent fragment for the Teams SDK App's client. The SDK's Client.clone
 * merges this with its own `teams.ts[apps]/<sdk-version>` identifier, so we
 * only contribute the Natesclaw piece — passing the full `buildUserAgent()`
 * would double-print the SDK token.
 *
 * Format: "Natesclaw/<natesclaw-version>"
 */
export function buildNatesclawUserAgentFragment(): string {
  return `Natesclaw/${resolveNatesclawVersion()}`;
}

export function ensureUserAgentHeader(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has("User-Agent")) {
    nextHeaders.set("User-Agent", buildUserAgent());
  }
  return nextHeaders;
}
