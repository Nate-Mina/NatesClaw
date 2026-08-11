import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { fullContextToolPayloadRedactionState } from "./redact-internal-state.js";

type LoggingConfig = NatesclawConfig["logging"];

export function isFullContextToolPayloadRedaction(loggingConfig: LoggingConfig): boolean {
  return fullContextToolPayloadRedactionState.isMarked(loggingConfig);
}
