import type { NatesclawConfig } from "../../config/types.natesclaw.js";
import type { AuthProfileStore } from "../auth-profiles/types.js";
import type { ToolModelConfig } from "./model-config.helpers.js";
import "./image-generate-tool.js";

type ImageGenerateToolTestApi = {
  resolveImageGenerationModelConfigForTool(params: {
    cfg?: NatesclawConfig;
    workspaceDir?: string;
    agentDir?: string;
    authStore?: AuthProfileStore;
  }): ToolModelConfig | null;
};

function getTestApi(): ImageGenerateToolTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.imageGenerateToolTestApi")
  ] as ImageGenerateToolTestApi;
}

export const resolveImageGenerationModelConfigForTool: ImageGenerateToolTestApi["resolveImageGenerationModelConfigForTool"] =
  (params) => getTestApi().resolveImageGenerationModelConfigForTool(params);
