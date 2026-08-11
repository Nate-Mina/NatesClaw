// Memory Core plugin module implements public artifacts behavior.
import {
  listMemoryHostPublicArtifacts,
  type MemoryPluginPublicArtifact,
} from "natesclaw/plugin-sdk/memory-host-core";
import type { NatesclawConfig } from "../api.js";

export async function listMemoryCorePublicArtifacts(params: {
  cfg: NatesclawConfig;
}): Promise<MemoryPluginPublicArtifact[]> {
  return await listMemoryHostPublicArtifacts(params);
}
