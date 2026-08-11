/**
 * Static identity for names that select core agent factory families before assembly.
 */

import { AUTOMATIONS_TOOL_NAME } from "./tools/automations-tool-name.js";

export type CoreToolFactoryFamily = "base-coding" | "shell" | "natesclaw";

type CoreToolFactoryDescriptor = {
  name: string;
  family: CoreToolFactoryFamily;
};

const CORE_TOOL_FACTORY_DESCRIPTORS = [
  { name: "edit", family: "base-coding" },
  { name: "read", family: "base-coding" },
  { name: "write", family: "base-coding" },
  { name: "apply_patch", family: "shell" },
  { name: "exec", family: "shell" },
  { name: "process", family: "shell" },
  { name: "agents_list", family: "natesclaw" },
  // Static factory identity only; runtime and tools.catalog apply the Swarm config gate.
  { name: "agents_wait", family: "natesclaw" },
  { name: "ask_user", family: "natesclaw" },
  { name: "natesclaw", family: "natesclaw" },
  { name: "computer", family: "natesclaw" },
  { name: "conversations_list", family: "natesclaw" },
  { name: "conversations_send", family: "natesclaw" },
  { name: "conversations_turn", family: "natesclaw" },
  { name: AUTOMATIONS_TOOL_NAME, family: "natesclaw" },
  { name: "dashboard", family: "natesclaw" },
  { name: "gateway", family: "natesclaw" },
  { name: "get_goal", family: "natesclaw" },
  { name: "heartbeat_respond", family: "natesclaw" },
  { name: "image", family: "natesclaw" },
  { name: "image_generate", family: "natesclaw" },
  { name: "message", family: "natesclaw" },
  { name: "mobile_ui", family: "natesclaw" },
  { name: "music_generate", family: "natesclaw" },
  { name: "nodes", family: "natesclaw" },
  { name: "pdf", family: "natesclaw" },
  { name: "session_status", family: "natesclaw" },
  { name: "show_widget", family: "natesclaw" },
  { name: "sessions", family: "natesclaw" },
  { name: "sessions_history", family: "natesclaw" },
  { name: "sessions_list", family: "natesclaw" },
  { name: "sessions_search", family: "natesclaw" },
  { name: "sessions_send", family: "natesclaw" },
  { name: "sessions_spawn", family: "natesclaw" },
  { name: "sessions_yield", family: "natesclaw" },
  { name: "structured_output", family: "natesclaw" },
  { name: "skill_workshop", family: "natesclaw" },
  { name: "suggest_task", family: "natesclaw" },
  { name: "create_goal", family: "natesclaw" },
  { name: "subagents", family: "natesclaw" },
  { name: "terminal", family: "natesclaw" },
  { name: "transcripts", family: "natesclaw" },
  { name: "tts", family: "natesclaw" },
  { name: "update_goal", family: "natesclaw" },
  { name: "update_plan", family: "natesclaw" },
  { name: "dismiss_task", family: "natesclaw" },
  { name: "video_generate", family: "natesclaw" },
  { name: "web_fetch", family: "natesclaw" },
  { name: "web_search", family: "natesclaw" },
] as const satisfies readonly CoreToolFactoryDescriptor[];

const CORE_TOOL_FACTORY_FAMILY_BY_NAME = new Map<string, CoreToolFactoryFamily>(
  CORE_TOOL_FACTORY_DESCRIPTORS.map(({ name, family }) => [name, family]),
);

export type NatesclawCodingToolConstructionPlan = {
  includeBaseCodingTools: boolean;
  includeShellTools: boolean;
  includeChannelTools: boolean;
  includeNatesclawTools: boolean;
  includePluginTools: boolean;
};

export function resolveCoreToolFactoryFamily(name: string): CoreToolFactoryFamily | undefined {
  return CORE_TOOL_FACTORY_FAMILY_BY_NAME.get(name);
}

/**
 * Core coding primitives (file + shell families). Tool-search compaction keeps
 * these directly visible: hiding them behind search adds a lookup round-trip to
 * nearly every coding turn.
 */
export function isCoreCodingSurfaceToolName(name: string): boolean {
  const family = CORE_TOOL_FACTORY_FAMILY_BY_NAME.get(name);
  return family === "base-coding" || family === "shell";
}
