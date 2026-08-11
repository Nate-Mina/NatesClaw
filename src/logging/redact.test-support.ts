import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { fullContextToolPayloadRedactionState } from "./redact-internal-state.js";

type LoggingConfig = NatesclawConfig["logging"];

export function withFullContextToolPayloadRedaction(loggingConfig: LoggingConfig): LoggingConfig {
  return fullContextToolPayloadRedactionState.mark(loggingConfig);
}
