import type { AgentRuntimeIdentity } from "../../../gateway/agent-runtime-identity-token.js";
import { withInProcessAgentRuntimeIdentity } from "../../../gateway/in-process-agent-runtime-identity.js";
import { getActiveAgentRunDelegatedAuthority } from "../../../infra/agent-run-registry.js";
import { getGatewayToolCallerIdentity } from "../../tools/gateway-caller-context.js";
import { runWithGatewaySessionSpawnContext } from "../../tools/gateway-session-spawn-context.js";
import { runWithGatewaySessionSpawnParentExecutionIdentity } from "../../tools/gateway-session-spawn-execution-identity.js";
import { callGatewayTool } from "../../tools/gateway.js";
import { resolveSubagentRunTimerDelayMs } from "../registry/subagent-run-timeout.js";
import type { SubagentLaunchAuthorization } from "./subagent-launch-authorization.js";
import { applySubagentLaunchAuthorization } from "./subagent-launch-authorization.js";
import { getSubagentSpawnDeps } from "./subagent-spawn-deps.js";
import { readSubagentGatewayExecutionIdentity } from "./subagent-spawn-execution-identity.js";
import {
  ADMIN_SCOPE,
  callGateway,
  resolveLeastPrivilegeOperatorScopesForMethod,
} from "./subagent-spawn.runtime.js";

const DEFAULT_SUBAGENT_AGENT_GATEWAY_TIMEOUT_MS = 60_000;
const MAX_SUBAGENT_AGENT_GATEWAY_TIMEOUT_MS = 300_000;

export async function callSubagentGateway(
  params: Parameters<typeof callGateway>[0],
  authorization?: SubagentLaunchAuthorization,
): Promise<Awaited<ReturnType<typeof callGateway>>> {
  const { sessionSpawnContext, parentExecutionIdentityToken } =
    readSubagentGatewayExecutionIdentity(params) ?? {};
  // Subagent lifecycle requires methods spanning multiple scope tiers
  // (sessions.delete → admin, agent → write). When each call
  // independently negotiates least-privilege scopes the first connection pairs
  // at a lower tier and every subsequent higher-tier call triggers a
  // scope-upgrade handshake that headless gateway-client connections cannot
  // complete interactively, causing close(1008) "pairing required" (#59428).
  //
  // Only admin-requiring calls are pinned to ADMIN_SCOPE; other methods (e.g.
  // "agent" -> write) keep their least-privilege scope. Apply the trusted
  // launch authorization before resolving the request's required scope.
  const authorizedParams =
    params.params != null && typeof params.params === "object" && !Array.isArray(params.params)
      ? applySubagentLaunchAuthorization(params.params as Record<string, unknown>, authorization)
      : params.params;
  const leastPrivilegeScopes = resolveLeastPrivilegeOperatorScopesForMethod(
    params.method,
    authorizedParams,
  );
  const allowModelOverride = authorization !== undefined;
  const deps = getSubagentSpawnDeps();
  const hasInProcessGateway = deps.hasInProcessGatewayContext();
  const needsOutOfProcessModelOverrideAuth = allowModelOverride && !hasInProcessGateway;
  const scopes =
    params.scopes ??
    (leastPrivilegeScopes.includes(ADMIN_SCOPE) || needsOutOfProcessModelOverrideAuth
      ? [ADMIN_SCOPE]
      : undefined);
  const request = {
    ...params,
    params: authorizedParams,
    ...(scopes != null ? { scopes } : {}),
  };
  if (
    hasInProcessGateway &&
    request.params != null &&
    typeof request.params === "object" &&
    !Array.isArray(request.params)
  ) {
    // Spawn is already running in the gateway process for channel/tool calls.
    // Direct dispatch avoids self-connecting over WS while the same event loop is busy.
    // Agent launches are host-owned even when the parent request came from CLI/HTTP.
    // Reusing that external identity makes collector preflight treat the launch as spoofed.
    const forceSyntheticClient = request.method === "agent" || scopes != null;
    const caller = getGatewayToolCallerIdentity();
    const activeAuthority = caller?.operationalRunInstance
      ? getActiveAgentRunDelegatedAuthority(caller.operationalRunInstance)
      : undefined;
    const agentRuntimeIdentity: AgentRuntimeIdentity | undefined =
      sessionSpawnContext && caller?.operationalRunInstance && activeAuthority
        ? {
            kind: "agentRuntime",
            agentId: caller.agentId,
            sessionKey: caller.sessionKey,
            operationalRunInstance: caller.operationalRunInstance,
            delegatedAuthority: { kind: "local", ...activeAuthority },
            ...(parentExecutionIdentityToken
              ? { executionIdentity: parentExecutionIdentityToken }
              : {}),
            sessionSpawnContext,
          }
        : undefined;
    return await deps.dispatchGatewayMethodInProcess(
      request.method,
      request.params as Record<string, unknown>,
      withInProcessAgentRuntimeIdentity(
        {
          expectFinal: request.expectFinal,
          ...(allowModelOverride ? { allowSyntheticModelOverride: true } : {}),
          ...(forceSyntheticClient ? { forceSyntheticClient: true } : {}),
          ...(typeof request.timeoutMs === "number" ? { timeoutMs: request.timeoutMs } : {}),
          ...(scopes != null ? { syntheticScopes: scopes } : {}),
        },
        agentRuntimeIdentity,
      ),
    );
  }
  return sessionSpawnContext
    ? await runWithGatewaySessionSpawnContext(sessionSpawnContext, () =>
        runWithGatewaySessionSpawnParentExecutionIdentity(parentExecutionIdentityToken, () =>
          callGatewayTool(
            request.method,
            {
              ...(typeof request.timeoutMs === "number" ? { timeoutMs: request.timeoutMs } : {}),
            },
            request.params,
            {
              expectFinal: request.expectFinal,
              scopes,
              requireAgentRuntimeIdentity: true,
            },
          ),
        ),
      )
    : await deps.callGateway(request);
}

export function readGatewayRunId(
  response: Awaited<ReturnType<typeof callGateway>>,
): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }
  const { runId } = response as { runId?: unknown };
  return typeof runId === "string" && runId.trim() ? runId.trim() : undefined;
}

export function resolveSubagentAgentGatewayTimeoutMs(runTimeoutSeconds: number): number {
  const runTimeoutMs = resolveSubagentRunTimerDelayMs(runTimeoutSeconds) ?? 0;
  if (runTimeoutMs <= 0) {
    return DEFAULT_SUBAGENT_AGENT_GATEWAY_TIMEOUT_MS;
  }
  return Math.min(
    MAX_SUBAGENT_AGENT_GATEWAY_TIMEOUT_MS,
    Math.max(DEFAULT_SUBAGENT_AGENT_GATEWAY_TIMEOUT_MS, runTimeoutMs + 5_000),
  );
}
