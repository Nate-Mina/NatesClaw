import type { Meter, MetricOptions } from "@opentelemetry/api";
import {
  AGENT_DURATION_MS_BUCKETS,
  CONTEXT_TOKENS_BUCKETS,
  GEN_AI_OPERATION_DURATION_BUCKETS,
  GEN_AI_TOKEN_USAGE_BUCKETS,
} from "./service-constants.js";

const DEFAULT_METRIC_NAME_PREFIX = "natesclaw.";

export function createDiagnosticsMetrics(
  meter: Meter,
  metricNamePrefix = DEFAULT_METRIC_NAME_PREFIX,
) {
  const resolveMetricName = (name: `natesclaw.${string}`) =>
    `${metricNamePrefix}${name.slice(DEFAULT_METRIC_NAME_PREFIX.length)}`;
  const createCounter = (name: `natesclaw.${string}`, options?: MetricOptions) =>
    meter.createCounter(resolveMetricName(name), options);
  const createHistogram = (name: `natesclaw.${string}`, options?: MetricOptions) =>
    meter.createHistogram(resolveMetricName(name), options);

  const tokensCounter = createCounter("natesclaw.tokens", {
    unit: "1",
    description: "Token usage by type",
  });
  const genAiTokenUsageHistogram = meter.createHistogram("gen_ai.client.token.usage", {
    unit: "{token}",
    description: "Number of input and output tokens used by GenAI client operations",
    advice: {
      explicitBucketBoundaries: GEN_AI_TOKEN_USAGE_BUCKETS,
    },
  });
  const genAiOperationDurationHistogram = meter.createHistogram(
    "gen_ai.client.operation.duration",
    {
      unit: "s",
      description: "GenAI client operation duration",
      advice: {
        explicitBucketBoundaries: GEN_AI_OPERATION_DURATION_BUCKETS,
      },
    },
  );
  const costCounter = createCounter("natesclaw.cost.usd", {
    unit: "1",
    description: "Estimated model cost (USD)",
  });
  const durationHistogram = createHistogram("natesclaw.run.duration_ms", {
    unit: "ms",
    description: "Agent run duration",
    advice: { explicitBucketBoundaries: AGENT_DURATION_MS_BUCKETS },
  });
  const harnessDurationHistogram = createHistogram("natesclaw.harness.duration_ms", {
    unit: "ms",
    description: "Agent harness lifecycle duration",
    advice: { explicitBucketBoundaries: AGENT_DURATION_MS_BUCKETS },
  });
  const contextHistogram = createHistogram("natesclaw.context.tokens", {
    unit: "1",
    description: "Context window size and usage",
    advice: { explicitBucketBoundaries: CONTEXT_TOKENS_BUCKETS },
  });
  const webhookReceivedCounter = createCounter("natesclaw.webhook.received", {
    unit: "1",
    description: "Webhook requests received",
  });
  const webhookErrorCounter = createCounter("natesclaw.webhook.error", {
    unit: "1",
    description: "Webhook processing errors",
  });
  const webhookDurationHistogram = createHistogram("natesclaw.webhook.duration_ms", {
    unit: "ms",
    description: "Webhook processing duration",
  });
  const messageQueuedCounter = createCounter("natesclaw.message.queued", {
    unit: "1",
    description: "Messages queued for processing",
  });
  const messageReceivedCounter = createCounter("natesclaw.message.received", {
    unit: "1",
    description: "Inbound messages received",
  });
  const messageDispatchStartedCounter = createCounter("natesclaw.message.dispatch.started", {
    unit: "1",
    description: "Inbound message dispatch attempts started",
  });
  const messageDispatchCompletedCounter = createCounter("natesclaw.message.dispatch.completed", {
    unit: "1",
    description: "Inbound message dispatch attempts completed",
  });
  const messageDispatchDurationHistogram = createHistogram(
    "natesclaw.message.dispatch.duration_ms",
    {
      unit: "ms",
      description: "Inbound message dispatch duration",
    },
  );
  const messageProcessedCounter = createCounter("natesclaw.message.processed", {
    unit: "1",
    description: "Messages processed by outcome",
  });
  const messageDurationHistogram = createHistogram("natesclaw.message.duration_ms", {
    unit: "ms",
    description: "Message processing duration",
  });
  const messageDeliveryStartedCounter = createCounter("natesclaw.message.delivery.started", {
    unit: "1",
    description: "Outbound message delivery attempts started",
  });
  const messageDeliveryDurationHistogram = createHistogram(
    "natesclaw.message.delivery.duration_ms",
    {
      unit: "ms",
      description: "Outbound message delivery duration",
    },
  );
  const queueDepthHistogram = createHistogram("natesclaw.queue.depth", {
    unit: "1",
    description: "Queue depth on enqueue/dequeue",
  });
  const queueWaitHistogram = createHistogram("natesclaw.queue.wait_ms", {
    unit: "ms",
    description: "Queue wait time before execution",
  });
  const laneEnqueueCounter = createCounter("natesclaw.queue.lane.enqueue", {
    unit: "1",
    description: "Command queue lane enqueue events",
  });
  const laneDequeueCounter = createCounter("natesclaw.queue.lane.dequeue", {
    unit: "1",
    description: "Command queue lane dequeue events",
  });
  const sessionStateCounter = createCounter("natesclaw.session.state", {
    unit: "1",
    description: "Session state transitions",
  });
  const sessionTurnCreatedCounter = createCounter("natesclaw.session.turn.created", {
    unit: "1",
    description: "Agent session turns created",
  });
  const sessionStuckCounter = createCounter("natesclaw.session.stuck", {
    unit: "1",
    description: "Sessions stuck in processing",
  });
  const sessionStuckAgeHistogram = createHistogram("natesclaw.session.stuck_age_ms", {
    unit: "ms",
    description: "Age of stuck sessions",
  });
  const sessionRecoveryRequestedCounter = createCounter("natesclaw.session.recovery.requested", {
    unit: "1",
    description: "Session recovery attempts requested",
  });
  const sessionRecoveryCompletedCounter = createCounter("natesclaw.session.recovery.completed", {
    unit: "1",
    description: "Session recovery attempts completed",
  });
  const sessionRecoveryAgeHistogram = createHistogram("natesclaw.session.recovery.age_ms", {
    unit: "ms",
    description: "Age of sessions selected for recovery",
  });
  const talkEventCounter = createCounter("natesclaw.talk.event", {
    unit: "1",
    description: "Talk events emitted by type",
  });
  const talkEventDurationHistogram = createHistogram("natesclaw.talk.event.duration_ms", {
    unit: "ms",
    description: "Talk event duration when reported",
  });
  const talkAudioBytesHistogram = createHistogram("natesclaw.talk.audio.bytes", {
    unit: "By",
    description: "Talk audio frame byte lengths",
  });
  const runAttemptCounter = createCounter("natesclaw.run.attempt", {
    unit: "1",
    description: "Run attempts",
  });
  const toolLoopCounter = createCounter("natesclaw.tool.loop", {
    unit: "1",
    description: "Detected repetitive tool-call loop events",
  });
  const skillUsedCounter = createCounter("natesclaw.skill.used", {
    unit: "1",
    description: "Skills used by agent runs",
  });
  const modelCallDurationHistogram = createHistogram("natesclaw.model_call.duration_ms", {
    unit: "ms",
    description: "Model call duration",
  });
  const modelCallRequestBytesHistogram = createHistogram("natesclaw.model_call.request_bytes", {
    unit: "By",
    description: "UTF-8 byte size of sanitized model request payloads",
  });
  const modelCallResponseBytesHistogram = createHistogram("natesclaw.model_call.response_bytes", {
    unit: "By",
    description: "UTF-8 byte size of bounded streamed model response payloads",
  });
  const modelCallTimeToFirstByteHistogram = createHistogram(
    "natesclaw.model_call.time_to_first_byte_ms",
    {
      unit: "ms",
      description: "Elapsed time before the first streamed model response event",
    },
  );
  const modelFailoverCounter = createCounter("natesclaw.model.failover", {
    unit: "1",
    description: "Model failovers by source, destination, lane, and reason",
  });
  const toolExecutionDurationHistogram = createHistogram("natesclaw.tool.execution.duration_ms", {
    unit: "ms",
    description: "Tool execution duration",
  });
  const toolExecutionBlockedCounter = createCounter("natesclaw.tool.execution.blocked", {
    unit: "1",
    description: "Tool executions blocked by policy or sandbox diagnostics",
  });
  const execProcessDurationHistogram = createHistogram("natesclaw.exec.duration_ms", {
    unit: "ms",
    description: "Exec process duration",
  });
  const memoryRssHistogram = createHistogram("natesclaw.memory.rss_bytes", {
    unit: "By",
    description: "Resident set size reported by diagnostic memory samples",
  });
  const memoryHeapUsedHistogram = createHistogram("natesclaw.memory.heap_used_bytes", {
    unit: "By",
    description: "Heap used bytes reported by diagnostic memory samples",
  });
  const memoryHeapTotalHistogram = createHistogram("natesclaw.memory.heap_total_bytes", {
    unit: "By",
    description: "Heap total bytes reported by diagnostic memory samples",
  });
  const memoryExternalHistogram = createHistogram("natesclaw.memory.external_bytes", {
    unit: "By",
    description: "External memory bytes reported by diagnostic memory samples",
  });
  const memoryArrayBuffersHistogram = createHistogram("natesclaw.memory.array_buffers_bytes", {
    unit: "By",
    description: "ArrayBuffer bytes reported by diagnostic memory samples",
  });
  const memoryPressureCounter = createCounter("natesclaw.memory.pressure", {
    unit: "1",
    description: "Diagnostic memory pressure events",
  });
  const asyncQueueDroppedCounter = createCounter("natesclaw.diagnostic.async_queue.dropped", {
    unit: "1",
    description: "Async diagnostic queue drops by dropped event class",
  });
  const payloadLargeCounter = createCounter("natesclaw.payload.large", {
    unit: "1",
    description: "Oversized payload diagnostics by surface and action",
  });
  const payloadLargeBytesHistogram = createHistogram("natesclaw.payload.large_bytes", {
    unit: "By",
    description: "Oversized payload byte sizes by surface and action",
  });
  const livenessWarningCounter = createCounter("natesclaw.liveness.warning", {
    unit: "1",
    description: "Diagnostic liveness warning events",
  });
  const livenessEventLoopDelayP99Histogram = createHistogram(
    "natesclaw.liveness.event_loop_delay_p99_ms",
    {
      unit: "ms",
      description: "P99 event-loop delay reported by diagnostic liveness warnings",
    },
  );
  const livenessEventLoopDelayMaxHistogram = createHistogram(
    "natesclaw.liveness.event_loop_delay_max_ms",
    {
      unit: "ms",
      description: "Maximum event-loop delay reported by diagnostic liveness warnings",
    },
  );
  const livenessEventLoopUtilizationHistogram = createHistogram(
    "natesclaw.liveness.event_loop_utilization",
    {
      unit: "1",
      description: "Event-loop utilization reported by diagnostic liveness warnings",
    },
  );
  const livenessCpuCoreRatioHistogram = createHistogram("natesclaw.liveness.cpu_core_ratio", {
    unit: "1",
    description: "CPU core ratio reported by diagnostic liveness warnings",
  });
  const telemetryExporterCounter = createCounter("natesclaw.telemetry.exporter.events", {
    unit: "1",
    description: "Diagnostic telemetry exporter lifecycle and failure events",
  });
  return {
    tokensCounter,
    genAiTokenUsageHistogram,
    genAiOperationDurationHistogram,
    costCounter,
    durationHistogram,
    harnessDurationHistogram,
    contextHistogram,
    webhookReceivedCounter,
    webhookErrorCounter,
    webhookDurationHistogram,
    messageQueuedCounter,
    messageReceivedCounter,
    messageDispatchStartedCounter,
    messageDispatchCompletedCounter,
    messageDispatchDurationHistogram,
    messageProcessedCounter,
    messageDurationHistogram,
    messageDeliveryStartedCounter,
    messageDeliveryDurationHistogram,
    queueDepthHistogram,
    queueWaitHistogram,
    laneEnqueueCounter,
    laneDequeueCounter,
    sessionStateCounter,
    sessionTurnCreatedCounter,
    sessionStuckCounter,
    sessionStuckAgeHistogram,
    sessionRecoveryRequestedCounter,
    sessionRecoveryCompletedCounter,
    sessionRecoveryAgeHistogram,
    talkEventCounter,
    talkEventDurationHistogram,
    talkAudioBytesHistogram,
    runAttemptCounter,
    toolLoopCounter,
    skillUsedCounter,
    modelCallDurationHistogram,
    modelCallRequestBytesHistogram,
    modelCallResponseBytesHistogram,
    modelCallTimeToFirstByteHistogram,
    modelFailoverCounter,
    toolExecutionDurationHistogram,
    toolExecutionBlockedCounter,
    execProcessDurationHistogram,
    memoryRssHistogram,
    memoryHeapUsedHistogram,
    memoryHeapTotalHistogram,
    memoryExternalHistogram,
    memoryArrayBuffersHistogram,
    memoryPressureCounter,
    asyncQueueDroppedCounter,
    payloadLargeCounter,
    payloadLargeBytesHistogram,
    livenessWarningCounter,
    livenessEventLoopDelayP99Histogram,
    livenessEventLoopDelayMaxHistogram,
    livenessEventLoopUtilizationHistogram,
    livenessCpuCoreRatioHistogram,
    telemetryExporterCounter,
  };
}

export type DiagnosticsMetrics = ReturnType<typeof createDiagnosticsMetrics>;
