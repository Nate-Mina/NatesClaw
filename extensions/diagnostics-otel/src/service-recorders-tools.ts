import { SpanStatusCode } from "@opentelemetry/api";
import { normalizeDiagnosticValue } from "natesclaw/plugin-sdk/diagnostic-runtime";
import { redactSensitiveText } from "../api.js";
import type { DiagnosticEventMetadata, DiagnosticEventPayload } from "../api.js";
import { positiveFiniteNumber } from "./service-genai-attributes.js";
import {
  assignOtelToolContentAttributes,
  assignOtelToolIdentityAttributes,
} from "./service-genai-content.js";
import type { OtelToolCallContent } from "./service-genai-content.js";
import type { DiagnosticsRecorderRuntime } from "./service-recorder-runtime.js";
import type { TelemetryExporterDiagnosticEvent } from "./service-types.js";

export function createToolAndSystemRecorders(runtime: DiagnosticsRecorderRuntime) {
  const {
    queueDepthHistogram,
    skillUsedCounter,
    toolExecutionDurationHistogram,
    toolExecutionBlockedCounter,
    execProcessDurationHistogram,
    payloadLargeCounter,
    payloadLargeBytesHistogram,
    livenessWarningCounter,
    livenessEventLoopDelayP99Histogram,
    livenessEventLoopDelayMaxHistogram,
    livenessEventLoopUtilizationHistogram,
    livenessCpuCoreRatioHistogram,
    telemetryExporterCounter,
    spanWithDuration,
    activeTrustedParentContext,
    exportedInternalOrTrustedContext,
    trackTrustedSpan,
    getTrackedInternalOrTrustedSpan,
    takeTrackedTrustedSpan,
    setSpanAttrs,
    addRunAttrs,
    paramsSummaryAttrs,
    contentCapturePolicy,
    tracesEnabled,
  } = runtime;

  const toolExecutionBaseAttrs = (
    evt: Extract<
      DiagnosticEventPayload,
      {
        type:
          | "tool.execution.started"
          | "tool.execution.completed"
          | "tool.execution.error"
          | "tool.execution.blocked";
      }
    >,
  ): Record<string, string | number | boolean> => ({
    "natesclaw.toolName": evt.toolName,
    "natesclaw.tool.source": normalizeDiagnosticValue(evt.toolSource, "core"),
    "gen_ai.tool.name": evt.toolName,
    ...(evt.toolOwner ? { "natesclaw.tool.owner": normalizeDiagnosticValue(evt.toolOwner) } : {}),
    ...paramsSummaryAttrs(evt.paramsSummary),
  });
  const toolTimestampMs = (evt: { sourceTimestampMs?: number; ts: number }) =>
    evt.sourceTimestampMs ?? evt.ts;

  const skillUsedAttrs = (
    evt: Extract<DiagnosticEventPayload, { type: "skill.used" }>,
  ): Record<string, string | number | boolean> => ({
    "natesclaw.skill.name": normalizeDiagnosticValue(evt.skillName, "skill"),
    "natesclaw.skill.source": normalizeDiagnosticValue(evt.skillSource),
    "natesclaw.skill.activation": normalizeDiagnosticValue(evt.activation),
    ...(evt.agentId ? { "natesclaw.agent": normalizeDiagnosticValue(evt.agentId) } : {}),
    ...(evt.toolName
      ? { "natesclaw.toolName": normalizeDiagnosticValue(evt.toolName, "tool") }
      : {}),
  });

  const recordSkillUsed = (
    evt: Extract<DiagnosticEventPayload, { type: "skill.used" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!metadata.trusted) {
      return;
    }
    const attrs = skillUsedAttrs(evt);
    skillUsedCounter.add(1, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    const span = spanWithDuration("natesclaw.skill.used", spanAttrs, 0, {
      parentContext: activeTrustedParentContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    setSpanAttrs(span, spanAttrs);
    span.end(evt.ts);
  };

  const recordToolExecutionStarted = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.started" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!tracesEnabled || !metadata.trusted) {
      return undefined;
    }
    const trackedSpan = getTrackedInternalOrTrustedSpan(evt, metadata);
    if (trackedSpan) {
      return trackedSpan.spanContext();
    }
    const spanAttrs = toolExecutionBaseAttrs(evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    return trackTrustedSpan(
      evt,
      metadata,
      spanWithDuration("natesclaw.tool.execution", spanAttrs, undefined, {
        parentContext: activeTrustedParentContext(evt, metadata),
        startTimeMs: toolTimestampMs(evt),
      }),
    ).spanContext();
  };

  const recordToolExecutionCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.completed" }>,
    metadata: DiagnosticEventMetadata,
    toolContent?: OtelToolCallContent,
  ) => {
    const attrs = toolExecutionBaseAttrs(evt);
    toolExecutionDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    assignOtelToolContentAttributes(spanAttrs, toolContent, contentCapturePolicy);
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("natesclaw.tool.execution", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: toolTimestampMs(evt),
      });
    setSpanAttrs(span, spanAttrs);
    span.end(toolTimestampMs(evt));
  };

  const recordToolExecutionError = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.error" }>,
    metadata: DiagnosticEventMetadata,
    toolContent?: OtelToolCallContent,
  ) => {
    const attrs = {
      ...toolExecutionBaseAttrs(evt),
      "natesclaw.errorCategory": normalizeDiagnosticValue(evt.errorCategory, "other"),
    };
    toolExecutionDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = { ...attrs };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    if (evt.errorCode) {
      spanAttrs["natesclaw.errorCode"] = normalizeDiagnosticValue(evt.errorCode, "other");
    }
    assignOtelToolContentAttributes(spanAttrs, toolContent, contentCapturePolicy);
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("natesclaw.tool.execution", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: toolTimestampMs(evt),
      });
    setSpanAttrs(span, spanAttrs);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: redactSensitiveText(evt.errorCategory),
    });
    span.end(toolTimestampMs(evt));
  };

  const recordToolExecutionBlocked = (
    evt: Extract<DiagnosticEventPayload, { type: "tool.execution.blocked" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    toolExecutionBlockedCounter.add(1, {
      ...toolExecutionBaseAttrs(evt),
      "natesclaw.deniedReason": normalizeDiagnosticValue(evt.deniedReason, "other"),
    });
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = {
      ...toolExecutionBaseAttrs(evt),
      "natesclaw.outcome": "blocked",
      "natesclaw.deniedReason": normalizeDiagnosticValue(evt.deniedReason, "other"),
    };
    addRunAttrs(spanAttrs, evt);
    assignOtelToolIdentityAttributes(spanAttrs, evt);
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("natesclaw.tool.execution", spanAttrs, 0, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: toolTimestampMs(evt),
      });
    setSpanAttrs(span, spanAttrs);
    span.end(toolTimestampMs(evt));
  };

  const recordPayloadLarge = (evt: Extract<DiagnosticEventPayload, { type: "payload.large" }>) => {
    const attrs = {
      "natesclaw.payload.action": evt.action,
      "natesclaw.payload.surface": normalizeDiagnosticValue(evt.surface, "unknown"),
      "natesclaw.channel": normalizeDiagnosticValue(evt.channel, "none"),
      "natesclaw.plugin": normalizeDiagnosticValue(evt.pluginId, "none"),
      "natesclaw.reason": normalizeDiagnosticValue(evt.reason, "none"),
    };
    payloadLargeCounter.add(1, attrs);
    const bytes = positiveFiniteNumber(evt.bytes);
    if (bytes !== undefined) {
      payloadLargeBytesHistogram.record(bytes, attrs);
    }
  };

  const recordExecProcessCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "exec.process.completed" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    const attrs: Record<string, string | number> = {
      "natesclaw.exec.target": evt.target,
      "natesclaw.exec.mode": evt.mode,
      "natesclaw.outcome": evt.outcome,
    };
    if (evt.failureKind) {
      attrs["natesclaw.failureKind"] = evt.failureKind;
    }
    execProcessDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }

    const spanAttrs: Record<string, string | number | boolean> = {
      ...attrs,
      "natesclaw.exec.command_length": evt.commandLength,
    };
    if (typeof evt.exitCode === "number") {
      spanAttrs["natesclaw.exec.exit_code"] = evt.exitCode;
    }
    if (evt.exitSignal) {
      spanAttrs["natesclaw.exec.exit_signal"] = normalizeDiagnosticValue(evt.exitSignal, "other");
    }
    if (evt.timedOut !== undefined) {
      spanAttrs["natesclaw.exec.timed_out"] = evt.timedOut;
    }

    // Exec events carry the innermost ambient scope rather than a child context, so
    // the parent is looked up by the event's own span id first. For the natesclaw
    // harness that scope is the harness run (no run scope is opened -
    // shouldEmitAgentRunDiagnostics is false there), so the parent is
    // natesclaw.harness.run; other harnesses open a run scope and parent to natesclaw.run.
    const span = spanWithDuration("natesclaw.exec", spanAttrs, evt.durationMs, {
      parentContext: exportedInternalOrTrustedContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    if (evt.outcome === "failed") {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        ...(evt.failureKind ? { message: evt.failureKind } : {}),
      });
    }
    span.end(evt.ts);
  };

  const recordHeartbeat = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.heartbeat" }>,
  ) => {
    queueDepthHistogram.record(evt.queued, { "natesclaw.channel": "heartbeat" });
  };

  const recordLivenessWarning = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.liveness.warning" }>,
  ) => {
    const reason = evt.reasons.join(":");
    const attrs = {
      "natesclaw.liveness.reason": normalizeDiagnosticValue(reason, "unknown"),
    };
    livenessWarningCounter.add(1, attrs);
    queueDepthHistogram.record(evt.queued, { "natesclaw.channel": "liveness" });
    if (evt.eventLoopDelayP99Ms !== undefined) {
      livenessEventLoopDelayP99Histogram.record(evt.eventLoopDelayP99Ms, attrs);
    }
    if (evt.eventLoopDelayMaxMs !== undefined) {
      livenessEventLoopDelayMaxHistogram.record(evt.eventLoopDelayMaxMs, attrs);
    }
    if (evt.eventLoopUtilization !== undefined) {
      livenessEventLoopUtilizationHistogram.record(evt.eventLoopUtilization, attrs);
    }
    if (evt.cpuCoreRatio !== undefined) {
      livenessCpuCoreRatioHistogram.record(evt.cpuCoreRatio, attrs);
    }
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number> = {
      ...attrs,
      "natesclaw.liveness.active": evt.active,
      "natesclaw.liveness.waiting": evt.waiting,
      "natesclaw.liveness.queued": evt.queued,
      "natesclaw.liveness.interval_ms": evt.intervalMs,
      ...(evt.eventLoopDelayP99Ms !== undefined
        ? { "natesclaw.liveness.event_loop_delay_p99_ms": evt.eventLoopDelayP99Ms }
        : {}),
      ...(evt.eventLoopDelayMaxMs !== undefined
        ? { "natesclaw.liveness.event_loop_delay_max_ms": evt.eventLoopDelayMaxMs }
        : {}),
      ...(evt.eventLoopUtilization !== undefined
        ? { "natesclaw.liveness.event_loop_utilization": evt.eventLoopUtilization }
        : {}),
      ...(evt.cpuUserMs !== undefined ? { "natesclaw.liveness.cpu_user_ms": evt.cpuUserMs } : {}),
      ...(evt.cpuSystemMs !== undefined
        ? { "natesclaw.liveness.cpu_system_ms": evt.cpuSystemMs }
        : {}),
      ...(evt.cpuTotalMs !== undefined ? { "natesclaw.liveness.cpu_total_ms": evt.cpuTotalMs } : {}),
      ...(evt.cpuCoreRatio !== undefined
        ? { "natesclaw.liveness.cpu_core_ratio": evt.cpuCoreRatio }
        : {}),
    };
    const span = spanWithDuration("natesclaw.liveness.warning", spanAttrs, 0, {
      endTimeMs: evt.ts,
    });
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: reason,
    });
    span.end(evt.ts);
  };

  const recordDiagnosticPhaseCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "diagnostic.phase.completed" }>,
  ) => {
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number> = {
      "natesclaw.phase": normalizeDiagnosticValue(evt.name, "unknown"),
      ...(evt.cpuUserMs !== undefined ? { "natesclaw.phase.cpu_user_ms": evt.cpuUserMs } : {}),
      ...(evt.cpuSystemMs !== undefined ? { "natesclaw.phase.cpu_system_ms": evt.cpuSystemMs } : {}),
      ...(evt.cpuTotalMs !== undefined ? { "natesclaw.phase.cpu_total_ms": evt.cpuTotalMs } : {}),
      ...(evt.cpuCoreRatio !== undefined
        ? { "natesclaw.phase.cpu_core_ratio": evt.cpuCoreRatio }
        : {}),
    };
    for (const [key, value] of Object.entries(evt.details ?? {})) {
      spanAttrs[`natesclaw.phase.detail.${key}`] =
        typeof value === "boolean" ? String(value) : value;
    }
    const span = spanWithDuration("natesclaw.diagnostic.phase", spanAttrs, evt.durationMs, {
      endTimeMs: evt.ts,
    });
    span.end(evt.ts);
  };

  const recordTelemetryExporter = (
    evt: TelemetryExporterDiagnosticEvent,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!metadata.trusted) {
      return;
    }
    telemetryExporterCounter.add(1, {
      "natesclaw.exporter": normalizeDiagnosticValue(evt.exporter, "unknown"),
      "natesclaw.signal": evt.signal,
      "natesclaw.status": evt.status,
      ...(evt.reason ? { "natesclaw.reason": evt.reason } : {}),
      ...(evt.errorCategory
        ? { "natesclaw.errorCategory": normalizeDiagnosticValue(evt.errorCategory, "other") }
        : {}),
    });
  };

  return {
    recordSkillUsed,
    recordToolExecutionStarted,
    recordToolExecutionCompleted,
    recordToolExecutionError,
    recordToolExecutionBlocked,
    recordPayloadLarge,
    recordExecProcessCompleted,
    recordHeartbeat,
    recordLivenessWarning,
    recordDiagnosticPhaseCompleted,
    recordTelemetryExporter,
  };
}
