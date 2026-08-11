// Diagnostics Otel API module exposes the plugin public contract.
export {
  createChildDiagnosticTraceContext,
  createDiagnosticTraceContext,
  emitDiagnosticEvent,
  formatDiagnosticTraceparent,
  isValidDiagnosticSpanId,
  isValidDiagnosticTraceFlags,
  isValidDiagnosticTraceId,
  onDiagnosticEvent,
  parseDiagnosticTraceparent,
  type DiagnosticEventMetadata,
  type DiagnosticEventPayload,
  type DiagnosticEventPrivateData,
  type DiagnosticTraceContext,
} from "natesclaw/plugin-sdk/diagnostic-runtime";
export { emptyPluginConfigSchema, type NatesclawPluginApi } from "natesclaw/plugin-sdk/plugin-entry";
export type {
  NatesclawPluginService,
  NatesclawPluginServiceContext,
} from "natesclaw/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "natesclaw/plugin-sdk/security-runtime";
