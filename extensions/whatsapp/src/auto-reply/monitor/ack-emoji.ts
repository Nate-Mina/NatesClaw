// Whatsapp plugin module implements ack emoji behavior.
import { resolveAgentIdentity } from "natesclaw/plugin-sdk/agent-runtime";
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

const DEFAULT_WHATSAPP_ACK_REACTION = "👀";

export function resolveWhatsAppAckEmoji(params: {
  cfg: NatesclawConfig;
  agentId: string;
  ackConfig: string | { emoji?: string } | undefined;
}): string {
  if (!params.ackConfig) {
    return "";
  }
  const configured =
    typeof params.ackConfig === "string" ? params.ackConfig : params.ackConfig.emoji;
  return (
    configured?.trim() ||
    resolveAgentIdentityEmoji(params.cfg, params.agentId) ||
    DEFAULT_WHATSAPP_ACK_REACTION
  );
}

function resolveAgentIdentityEmoji(cfg: NatesclawConfig, agentId: string): string | undefined {
  const emoji = resolveAgentIdentity(cfg, agentId)?.emoji?.trim();
  return emoji || undefined;
}
