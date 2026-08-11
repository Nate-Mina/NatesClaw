// Voice Call plugin module implements realtime fast context behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import {
  resolveRealtimeVoiceFastContextConsult,
  type RealtimeVoiceFastContextConsultResult,
  type RealtimeVoiceFastContextConfig,
} from "natesclaw/plugin-sdk/realtime-voice";

type Logger = {
  debug?: (message: string) => void;
};

// Voice-call labels for the SDK realtime fast-context resolver.

/** Resolve fast-context consult data using caller-oriented labels. */
export async function resolveRealtimeFastContextConsult(params: {
  cfg: NatesclawConfig;
  agentId: string;
  sessionKey: string;
  config: RealtimeVoiceFastContextConfig;
  args: unknown;
  logger: Logger;
}): Promise<RealtimeVoiceFastContextConsultResult> {
  return await resolveRealtimeVoiceFastContextConsult({
    ...params,
    labels: {
      audienceLabel: "caller",
      contextName: "Natesclaw memory or session context",
    },
  });
}
