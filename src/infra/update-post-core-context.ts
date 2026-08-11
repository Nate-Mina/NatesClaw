import type { NatesclawConfig } from "../config/types.natesclaw.js";

export const POST_CORE_UPDATE_ENV = "NATESCLAW_UPDATE_POST_CORE";
export const POST_CORE_UPDATE_SOURCE_CONFIG_PATH_ENV =
  "NATESCLAW_UPDATE_POST_CORE_SOURCE_CONFIG_PATH";

export type PreUpdateConfigRestoreInput = {
  sourceConfig: NatesclawConfig;
  authoredConfig: NatesclawConfig;
};
