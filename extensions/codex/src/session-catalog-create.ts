import {
  resolveAllowedModelRef,
  resolveDefaultAgentId,
  resolveDefaultModelForAgent,
} from "natesclaw/plugin-sdk/agent-runtime";
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

const CODEX_AGENT_RUNTIME_ID = "codex";
const CODEX_CATALOG_DEFAULT_MODEL_REF = "openai/gpt-5.6-sol";

export function resolveCodexCatalogCreateSession(
  config: NatesclawConfig | undefined,
  requestedAgentId?: string,
): { model: string; agentRuntime: string } | undefined {
  if (!config) {
    return undefined;
  }
  const agentId = requestedAgentId ?? resolveDefaultAgentId(config);
  const defaultModel = resolveDefaultModelForAgent({ cfg: config, agentId });
  const allowed = resolveAllowedModelRef({
    cfg: config,
    catalog: [],
    raw: CODEX_CATALOG_DEFAULT_MODEL_REF,
    defaultProvider: defaultModel.provider,
    defaultModel: defaultModel.model,
    agentId,
  });
  return "error" in allowed
    ? undefined
    : { model: CODEX_CATALOG_DEFAULT_MODEL_REF, agentRuntime: CODEX_AGENT_RUNTIME_ID };
}
