// Identifies Natesclaw-authored assistant rows that are transcript bookkeeping,
// not provider model output. Some history surfaces keep gateway-injected rows
// visible, so use the narrower delivery-mirror predicate when visibility matters.
export const NATESCLAW_TRANSCRIPT_ARTIFACT_API = "natesclaw-transcript" as const;
export const NATESCLAW_TRANSCRIPT_ARTIFACT_PROVIDER = "natesclaw" as const;
export const NATESCLAW_DELIVERY_MIRROR_MODEL = "delivery-mirror" as const;
const NATESCLAW_GATEWAY_INJECTED_MODEL = "gateway-injected" as const;

const TRANSCRIPT_ONLY_NATESCLAW_ASSISTANT_MODELS = new Set<string>([
  NATESCLAW_DELIVERY_MIRROR_MODEL,
  NATESCLAW_GATEWAY_INJECTED_MODEL,
]);
const NATESCLAW_DELIVERY_MIRROR_KINDS = new Set([
  "channel-final",
  "channel-final-suppressed",
  "message-tool-source-reply",
]);

function isNatesclawDeliveryMirrorMarker(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const kind = (value as { kind?: unknown }).kind;
  return typeof kind === "string" && NATESCLAW_DELIVERY_MIRROR_KINDS.has(kind);
}

export function isTranscriptOnlyNatesclawAssistantModel(provider: unknown, model: unknown): boolean {
  return (
    provider === NATESCLAW_TRANSCRIPT_ARTIFACT_PROVIDER &&
    typeof model === "string" &&
    TRANSCRIPT_ONLY_NATESCLAW_ASSISTANT_MODELS.has(model)
  );
}

/**
 * Returns true when the message is an Natesclaw-authored transcript artifact
 * that must not be replayed to providers.
 *
 * Primary check: provider="natesclaw" + model in known transcript-only set.
 * Fallback: a valid natesclawDeliveryMirror marker catches observed historical
 * rows whose provider/model provenance was stripped (#99470).
 */
export function isTranscriptOnlyNatesclawAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as {
    role?: unknown;
    provider?: unknown;
    model?: unknown;
    natesclawDeliveryMirror?: unknown;
  };
  if (entry.role !== "assistant") {
    return false;
  }
  if (isTranscriptOnlyNatesclawAssistantModel(entry.provider, entry.model)) {
    return true;
  }
  return isNatesclawDeliveryMirrorMarker(entry.natesclawDeliveryMirror);
}

export function isNatesclawMessageToolMirrorAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as { role?: unknown; natesclawMessageToolMirror?: unknown };
  return entry.role === "assistant" && entry.natesclawMessageToolMirror !== undefined;
}

export function isNatesclawInternalSourceReplyMirrorAssistantMessage(message: unknown): boolean {
  if (!isNatesclawMessageToolMirrorAssistantMessage(message)) {
    return false;
  }
  const marker = (message as { natesclawMessageToolMirror?: unknown }).natesclawMessageToolMirror;
  return (
    Boolean(marker) &&
    typeof marker === "object" &&
    !Array.isArray(marker) &&
    (marker as { sourceReplySink?: unknown }).sourceReplySink === "internal-ui"
  );
}

export function isNatesclawDeliveryMirrorAssistantMessage(message: unknown): boolean {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return false;
  }
  const entry = message as { role?: unknown; provider?: unknown; model?: unknown };
  return (
    entry.role === "assistant" &&
    entry.provider === NATESCLAW_TRANSCRIPT_ARTIFACT_PROVIDER &&
    entry.model === NATESCLAW_DELIVERY_MIRROR_MODEL
  );
}
