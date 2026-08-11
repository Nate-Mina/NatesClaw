// Normalizes agent prompt surface kinds advertised by plugins.
import type { AgentPromptSurfaceKind } from "./types.js";

/** Normalizes legacy prompt surface names to current Natesclaw surface names. */
export function normalizeAgentPromptSurfaceKind(
  surface: AgentPromptSurfaceKind,
): AgentPromptSurfaceKind {
  return surface === "pi_main" ? "natesclaw_main" : surface;
}

/** True when a prompt surface targets the main Natesclaw prompt. */
export function isNatesclawMainPromptSurface(surface: AgentPromptSurfaceKind): boolean {
  return normalizeAgentPromptSurfaceKind(surface) === "natesclaw_main";
}
