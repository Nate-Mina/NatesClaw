// Durable rolling transcript for the machine-wide OpenClaw conversation.
import { randomUUID } from "node:crypto";
import type { SystemAgentChatHistoryWizardAction } from "../../packages/gateway-protocol/src/index.js";
import { createSqliteAuditRecordStore } from "../infra/sqlite-audit-record-store.js";

type SystemAgentTranscriptEntry = {
  role: "user" | "assistant" | "reset";
  text: string;
  at: number;
  sessionId?: string;
  incarnationId?: string;
  wizardAction?: SystemAgentChatHistoryWizardAction;
};

type StoredSystemAgentTranscriptEntry = Omit<
  SystemAgentTranscriptEntry,
  "sessionId" | "incarnationId"
>;

type SystemAgentTranscriptSession = {
  sessionId: string;
  incarnationId: string;
};

type SystemAgentTranscriptTurn = {
  role: "user" | "assistant";
  text: string;
  at: number;
  sessionId?: string;
  wizardAction?: SystemAgentChatHistoryWizardAction;
};

const SYSTEM_AGENT_TRANSCRIPT_SCOPE = "system-agent-transcript";
const SYSTEM_AGENT_TRANSCRIPT_MAX_ENTRIES = 1_000;
const SYSTEM_AGENT_TRANSCRIPT_SESSION_KEY_PREFIX = "session:";
const SYSTEM_AGENT_TRANSCRIPT_INCARNATION_KEY_MARKER = ":incarnation:";

function openTranscriptStore(env?: NodeJS.ProcessEnv) {
  return createSqliteAuditRecordStore<StoredSystemAgentTranscriptEntry>({
    scope: SYSTEM_AGENT_TRANSCRIPT_SCOPE,
    maxEntries: SYSTEM_AGENT_TRANSCRIPT_MAX_ENTRIES,
    ...(env ? { env } : {}),
  });
}

function createTranscriptEntryKey(
  turn: StoredSystemAgentTranscriptEntry,
  session?: SystemAgentTranscriptSession,
): string {
  const suffix = `${turn.at}:${randomUUID()}`;
  return session
    ? `${SYSTEM_AGENT_TRANSCRIPT_SESSION_KEY_PREFIX}${Buffer.from(session.sessionId, "utf8").toString("base64url")}${SYSTEM_AGENT_TRANSCRIPT_INCARNATION_KEY_MARKER}${Buffer.from(session.incarnationId, "utf8").toString("base64url")}:${suffix}`
    : suffix;
}

function readTranscriptSessionId(key: string): string | undefined {
  if (!key.startsWith(SYSTEM_AGENT_TRANSCRIPT_SESSION_KEY_PREFIX)) {
    return undefined;
  }
  const encoded = key.slice(SYSTEM_AGENT_TRANSCRIPT_SESSION_KEY_PREFIX.length).split(":", 1)[0];
  if (!encoded) {
    return undefined;
  }
  const sessionId = Buffer.from(encoded, "base64url").toString("utf8");
  return sessionId && Buffer.from(sessionId, "utf8").toString("base64url") === encoded
    ? sessionId
    : undefined;
}

function readTranscriptIncarnationId(key: string): string | undefined {
  const markerIndex = key.indexOf(SYSTEM_AGENT_TRANSCRIPT_INCARNATION_KEY_MARKER);
  if (markerIndex < 0) {
    return undefined;
  }
  const encoded = key
    .slice(markerIndex + SYSTEM_AGENT_TRANSCRIPT_INCARNATION_KEY_MARKER.length)
    .split(":", 1)[0];
  if (!encoded) {
    return undefined;
  }
  const incarnationId = Buffer.from(encoded, "base64url").toString("utf8");
  return incarnationId && Buffer.from(incarnationId, "utf8").toString("base64url") === encoded
    ? incarnationId
    : undefined;
}

/** Append one already-sanitized engine history turn to the rolling logbook. */
export function appendTranscriptTurn(
  turn: StoredSystemAgentTranscriptEntry,
  opts: { env?: NodeJS.ProcessEnv; session?: SystemAgentTranscriptSession } = {},
): void {
  // Keep session attribution in the audit key, not the payload. Released readers
  // return payloads verbatim, so adding fields there would break downgrade responses.
  openTranscriptStore(opts.env).register(
    createTranscriptEntryKey(turn, opts.session),
    turn,
    turn.at,
  );
}

/** Mark a durable context boundary without deleting earlier logbook rows. */
export function appendTranscriptReset(
  opts: { env?: NodeJS.ProcessEnv; session?: SystemAgentTranscriptSession } = {},
): void {
  appendTranscriptTurn({ role: "reset", text: "", at: Date.now() }, opts);
}

/**
 * Read the newest window in conversational (oldest-first) order. Markers are
 * never exposed; seeding may additionally start after the newest marker.
 */
export function readTranscriptTail(
  limit: number,
  opts: {
    afterLastReset?: boolean;
    env?: NodeJS.ProcessEnv;
    session?: SystemAgentTranscriptSession;
  } = {},
): SystemAgentTranscriptTurn[] {
  if (limit <= 0) {
    return [];
  }
  const readLimit = opts.session ? SYSTEM_AGENT_TRANSCRIPT_MAX_ENTRIES : limit;
  const entries = openTranscriptStore(opts.env)
    .latest({ limit: readLimit })
    .toReversed()
    .map((entry): SystemAgentTranscriptEntry => {
      const turn: SystemAgentTranscriptEntry = {
        role: entry.value.role,
        text: entry.value.text,
        at: entry.value.at,
      };
      const sessionId = readTranscriptSessionId(entry.key);
      const incarnationId = readTranscriptIncarnationId(entry.key);
      if (sessionId) {
        turn.sessionId = sessionId;
      }
      if (incarnationId) {
        turn.incarnationId = incarnationId;
      }
      return turn;
    });
  // New reset markers fence only their owning session. Legacy unattributed markers
  // remain global so upgraded installs preserve the old machine-wide boundary.
  const resetIndex = opts.afterLastReset
    ? entries.findLastIndex(
        (turn) =>
          turn.role === "reset" &&
          (opts.session === undefined ||
            turn.sessionId === undefined ||
            (turn.sessionId === opts.session.sessionId &&
              turn.incarnationId === opts.session.incarnationId)),
      )
    : -1;
  const window = opts.afterLastReset ? entries.slice(resetIndex + 1) : entries;
  return window
    .filter(
      (turn): turn is SystemAgentTranscriptEntry & { role: "user" | "assistant" } =>
        turn.role !== "reset" &&
        (!opts.session ||
          (turn.sessionId === opts.session.sessionId &&
            turn.incarnationId === opts.session.incarnationId)),
    )
    .slice(-limit)
    .map(({ role, text, at, sessionId, wizardAction }) => ({
      role,
      text,
      at,
      ...(sessionId ? { sessionId } : {}),
      ...(wizardAction ? { wizardAction } : {}),
    }));
}
