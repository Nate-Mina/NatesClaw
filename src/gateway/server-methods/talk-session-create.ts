import { normalizeOptionalString } from "@openclaw/normalization-core/string-coerce";
import {
  ErrorCodes,
  errorShape,
  validateTalkSessionCreateParams,
} from "../../../packages/gateway-protocol/src/index.js";
import { ADMIN_SCOPE } from "../operator-scopes.js";
import { resolveSessionKeyFromResolveParams } from "../sessions-resolve.js";
import { createTalkHandoff } from "../talk-handoff.js";
import {
  createGatewayRealtimeTalkSession,
  TalkRealtimeSessionRequestError,
} from "../talk-realtime-session-create.js";
import { rememberUnifiedTalkSession } from "../talk-session-registry.js";
import { createTalkTranscriptionRelaySession } from "../talk-transcription-relay.js";
import { respondInvalidRequest, respondOk, respondUnavailable } from "./talk-session-response.js";
import {
  buildTalkTranscriptionConfig,
  canUseTalkDirectTools,
  normalizeTalkSessionBrain,
  normalizeTalkSessionMode,
  normalizeTalkSessionTransport,
  resolveConfiguredRealtimeTranscriptionProvider,
} from "./talk-shared.js";
import type { GatewayRequestHandler } from "./types.js";
import { assertValidParams } from "./validation.js";

const canCreateUnscopedManagedRoomSession = (
  client: { connect?: { scopes?: string[] } } | null,
): boolean => client?.connect?.scopes?.includes(ADMIN_SCOPE) === true;

export const createTalkSession: GatewayRequestHandler = async ({
  params,
  respond,
  context,
  client,
}) => {
  if (!assertValidParams(params, validateTalkSessionCreateParams, "talk.session.create", respond)) {
    return;
  }

  const mode = normalizeTalkSessionMode(params);
  const transport = normalizeTalkSessionTransport({ mode, transport: params.transport });
  const brain = normalizeTalkSessionBrain({ mode, brain: params.brain });

  if (transport === "webrtc" || transport === "provider-websocket") {
    respondInvalidRequest(
      respond,
      `talk.session.create is Gateway-managed; use talk.client.create for client transport "${transport}"`,
    );
    return;
  }

  try {
    if (transport === "managed-room") {
      if (brain === "direct-tools" && !canUseTalkDirectTools(client)) {
        respondInvalidRequest(
          respond,
          `talk.session.create brain="direct-tools" requires gateway scope: ${ADMIN_SCOPE}`,
        );
        return;
      }
      const spawnedBy = normalizeOptionalString(params.spawnedBy);
      if (
        normalizeOptionalString(params.sessionKey) &&
        !spawnedBy &&
        !canCreateUnscopedManagedRoomSession(client)
      ) {
        respondInvalidRequest(
          respond,
          `talk.session.create managed-room sessionKey requires spawnedBy or gateway scope: ${ADMIN_SCOPE}`,
        );
        return;
      }
      const resolvedSession = await resolveSessionKeyFromResolveParams({
        cfg: context.getRuntimeConfig(),
        client,
        p: {
          key: params.sessionKey,
          ...(spawnedBy ? { spawnedBy } : {}),
          includeGlobal: true,
          includeUnknown: true,
        },
      });
      if (!resolvedSession.ok) {
        respond(false, undefined, resolvedSession.error);
        return;
      }
      if ("missing" in resolvedSession || "ambiguous" in resolvedSession) {
        respondInvalidRequest(respond, `No session found: ${params.sessionKey}`);
        return;
      }
      const handoff = createTalkHandoff({
        sessionKey: resolvedSession.key,
        provider: normalizeOptionalString(params.provider),
        model: normalizeOptionalString(params.model),
        voice: normalizeOptionalString(params.voice),
        mode,
        transport,
        brain,
        ttlMs: params.ttlMs,
      });
      rememberUnifiedTalkSession(handoff.id, {
        kind: "managed-room",
        handoffId: handoff.id,
        token: handoff.token,
        roomId: handoff.roomId,
      });
      return respondOk(respond, {
        sessionId: handoff.id,
        provider: handoff.provider,
        mode: handoff.mode,
        transport: handoff.transport,
        brain: handoff.brain,
        handoffId: handoff.id,
        roomId: handoff.roomId,
        roomUrl: handoff.roomUrl,
        token: handoff.token,
        model: handoff.model,
        voice: handoff.voice,
        expiresAt: handoff.expiresAt,
      });
    }

    const connId = client?.connId;
    if (!connId) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "Talk session unavailable"));
      return;
    }

    if (mode === "realtime") {
      if (transport !== "gateway-relay" || brain !== "agent-consult") {
        return respondInvalidRequest(
          respond,
          `realtime talk.session.create requires transport="gateway-relay" and brain="agent-consult"`,
        );
      }
      try {
        const session = await createGatewayRealtimeTalkSession({
          context,
          ownerId: connId,
          request: params,
        });
        respondOk(respond, session);
      } catch (error) {
        if (error instanceof TalkRealtimeSessionRequestError) {
          respondInvalidRequest(respond, error.message);
          return;
        }
        throw error;
      }
      return;
    }

    if (mode === "transcription") {
      if (transport !== "gateway-relay" || brain !== "none") {
        respondInvalidRequest(
          respond,
          `transcription talk.session.create requires transport="gateway-relay" and brain="none"`,
        );
        return;
      }
      const runtimeConfig = context.getRuntimeConfig();
      const transcriptionConfig = buildTalkTranscriptionConfig(runtimeConfig, params.provider);
      const resolution = resolveConfiguredRealtimeTranscriptionProvider({
        config: runtimeConfig,
        configuredProviderId: transcriptionConfig.provider,
        providerConfigs: transcriptionConfig.providers,
        defaultModel: transcriptionConfig.model,
      });
      const session = createTalkTranscriptionRelaySession({
        context,
        connId,
        provider: resolution.provider,
        providerConfig: resolution.providerConfig,
      });
      rememberUnifiedTalkSession(session.transcriptionSessionId, {
        kind: "transcription-relay",
        connId,
        transcriptionSessionId: session.transcriptionSessionId,
      });
      respondOk(respond, {
        ...session,
        sessionId: session.transcriptionSessionId,
        brain,
      });
      return;
    }

    respondInvalidRequest(respond, `stt-tts talk.session.create requires transport="managed-room"`);
  } catch (err) {
    respondUnavailable(respond, err);
  }
};
