// Diagnostics Prometheus API module exposes the plugin public contract.
export type {
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "natesclaw/plugin-sdk/diagnostic-runtime";
export { isInternalDiagnosticEventMetadata } from "natesclaw/plugin-sdk/diagnostic-runtime";
export {
  emptyPluginConfigSchema,
  type NatesclawPluginApi,
  type NatesclawPluginHttpRouteHandler,
  type NatesclawPluginService,
  type NatesclawPluginServiceContext,
} from "natesclaw/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "natesclaw/plugin-sdk/security-runtime";
