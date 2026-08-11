// Private runtime barrel for the bundled Voice Call extension.
// Keep this barrel thin and aligned with the local extension surface.

export { definePluginEntry } from "natesclaw/plugin-sdk/plugin-entry";
export type { NatesclawPluginApi } from "natesclaw/plugin-sdk/plugin-entry";
export type { GatewayRequestHandlerOptions } from "natesclaw/plugin-sdk/gateway-runtime";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "natesclaw/plugin-sdk/webhook-request-guards";
export { fetchWithSsrFGuard, isBlockedHostnameOrIp } from "natesclaw/plugin-sdk/ssrf-runtime";
export type { SessionEntry } from "natesclaw/plugin-sdk/session-store-runtime";
export {
  TtsAutoSchema,
  TtsConfigSchema,
  TtsModeSchema,
  TtsProviderSchema,
} from "natesclaw/plugin-sdk/tts-runtime";
export { sleep } from "natesclaw/plugin-sdk/runtime-env";
