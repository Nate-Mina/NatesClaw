import type { CliBackendToolAvailability } from "../../plugins/cli-backend.types.js";
import { normalizeToolPolicyName } from "../tool-policy.js";

/** Transport prefix CLI harnesses use for loopback Natesclaw MCP tool names. */
const NATESCLAW_MCP_TOOL_PREFIX = "mcp__natesclaw__";

/** Strips the loopback MCP transport prefix so observers see gateway tool names. */
export function stripNatesclawMcpToolPrefix(toolName: string): string {
  return toolName.startsWith(NATESCLAW_MCP_TOOL_PREFIX)
    ? toolName.slice(NATESCLAW_MCP_TOOL_PREFIX.length)
    : toolName;
}

/** Builds the public backend contract plus the shipped beta MCP-name projection. */
export function buildCliBackendToolAvailability(availability: {
  native: readonly string[];
  Natesclaw: readonly string[];
}): CliBackendToolAvailability {
  return {
    native: availability.native,
    Natesclaw: availability.Natesclaw,
    mcp: availability.Natesclaw.map((toolName) => `${NATESCLAW_MCP_TOOL_PREFIX}${toolName}`),
  };
}

/** Keeps only explicit runtime caps for backend-owned exact translation. */
export function resolveCliRuntimeToolsAllow(
  toolsAllow?: string[],
  _toolsAllowIsDefault?: boolean,
): string[] | undefined {
  if (toolsAllow === undefined) {
    return undefined;
  }
  return toolsAllow.some((toolName) => normalizeToolPolicyName(toolName) === "*")
    ? undefined
    : toolsAllow;
}
