// Voice Call plugin module implements core bridge behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import type { NatesclawPluginApi } from "../api.js";

// Narrow core runtime/config contracts consumed by the voice-call plugin.

/** Core config subset read by voice-call helpers. */
export type CoreConfig = NatesclawConfig;

/** Agent runtime API subset exposed through the plugin SDK. */
export type CoreAgentDeps = NatesclawPluginApi["runtime"]["agent"];
