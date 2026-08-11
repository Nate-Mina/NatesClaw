import { SessionManager } from "../../agents/sessions/session-manager.js";
import type { SessionEntry } from "../../config/sessions.js";
import type { NatesclawConfig } from "../../config/types.natesclaw.js";

export async function appendSessionAudit(params: {
  cfg: NatesclawConfig;
  target: {
    agentId: string;
    entry: Pick<SessionEntry, "sessionId">;
    sessionKey: string;
    storePath: string;
  };
  text: string;
  now: number;
}): Promise<void> {
  const identity = {
    agentId: params.target.agentId,
    sessionId: params.target.entry.sessionId,
    storePath: params.target.storePath,
  };
  SessionManager.appendMessageToTranscript(
    { ...identity, sessionKey: params.target.sessionKey },
    {
      role: "custom",
      customType: "natesclaw.system-note",
      content: `System note: ${params.text}`,
      display: true,
      timestamp: params.now,
    },
    { config: params.cfg },
  );
}
