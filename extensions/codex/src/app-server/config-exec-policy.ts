import { AgentHarnessPreflightError } from "natesclaw/plugin-sdk/agent-harness-runtime";
import {
  resolveExecApprovalsFromFile,
  type ExecApprovalsFile,
} from "natesclaw/plugin-sdk/exec-approvals-runtime";
import { normalizeAgentId } from "natesclaw/plugin-sdk/routing";
import type {
  CodexAppServerApprovalPolicy,
  CodexAppServerApprovalsReviewer,
  CodexAppServerDefaultPolicy,
  CodexAppServerPolicyMode,
  CodexAppServerSandboxMode,
  NatesclawExecApprovalFloorsForCodexAppServer,
  NatesclawExecAsk,
  NatesclawExecMode,
  NatesclawExecPolicy,
  NatesclawExecPolicyForCodexAppServer,
  NatesclawExecSecurity,
} from "./config-contracts.js";
import { readExecAsk, readExecSecurity, readRecord } from "./config-utils.js";

export function selectForcedPromptingSandbox(params: {
  configuredSandbox?: CodexAppServerSandboxMode;
  defaultSandbox?: CodexAppServerSandboxMode;
}): CodexAppServerSandboxMode {
  if (params.configuredSandbox === "read-only" || params.defaultSandbox === "read-only") {
    return "read-only";
  }
  return params.defaultSandbox ?? "workspace-write";
}

export function selectForcedDangerFullAccessSandbox(params: {
  configuredSandbox?: CodexAppServerSandboxMode;
  defaultPolicy: CodexAppServerDefaultPolicy | undefined;
  NatesclawSandboxActive: boolean;
}): CodexAppServerSandboxMode {
  if (params.configuredSandbox === "read-only") {
    return "read-only";
  }
  if (params.defaultPolicy?.dangerFullAccessAllowed === false) {
    if (params.NatesclawSandboxActive) {
      return params.defaultPolicy.sandbox ?? "workspace-write";
    }
    throw new Error(
      "legacy full exec security with ask requires Codex app-server danger-full-access",
    );
  }
  return "danger-full-access";
}

export function selectGuardianSandbox(
  allowedSandboxModes: Set<CodexAppServerSandboxMode> | undefined,
): CodexAppServerSandboxMode {
  if (allowedSandboxModes === undefined || allowedSandboxModes.has("workspace-write")) {
    return "workspace-write";
  }
  if (allowedSandboxModes.has("read-only")) {
    return "read-only";
  }
  if (allowedSandboxModes.has("danger-full-access")) {
    return "danger-full-access";
  }
  return "workspace-write";
}

export function resolveApprovalPolicy(value: unknown): CodexAppServerApprovalPolicy | undefined {
  if (value === "on-failure") {
    return "on-request";
  }
  return value === "on-request" || value === "untrusted" || value === "never" ? value : undefined;
}

export function resolveSandbox(value: unknown): CodexAppServerSandboxMode | undefined {
  return value === "read-only" || value === "workspace-write" || value === "danger-full-access"
    ? value
    : undefined;
}

export function resolveApprovalsReviewer(
  value: unknown,
): CodexAppServerApprovalsReviewer | undefined {
  return value === "auto_review" || value === "guardian_subagent" || value === "user"
    ? value
    : undefined;
}

function resolveNatesclawExecPolicyFromConfig(params: {
  config?: unknown;
  agentId?: string;
}): NatesclawExecPolicy {
  const root = readRecord(params.config);
  const globalExec = readRecord(readRecord(root?.tools)?.exec);
  const globalPolicy = applyNatesclawExecPolicyLayer(createDefaultNatesclawExecPolicy(), globalExec);
  const agentId = params.agentId?.trim();
  if (!agentId) {
    return globalPolicy;
  }
  const agents = readRecord(root?.agents);
  const agentList = Array.isArray(agents?.list) ? agents.list : [];
  const normalizedAgentId = normalizeAgentId(agentId);
  const agentEntry = agentList.find((entry) => {
    const id = readRecord(entry)?.id;
    return typeof id === "string" && normalizeAgentId(id) === normalizedAgentId;
  });
  const agentExec = readRecord(readRecord(readRecord(agentEntry)?.tools)?.exec);
  return applyNatesclawExecPolicyLayer(globalPolicy, agentExec);
}

export function resolveNatesclawExecPolicyForCodexAppServer(params: {
  execOverrides?: {
    security?: unknown;
    ask?: unknown;
  };
  approvals?: ExecApprovalsFile;
  config?: unknown;
  agentId?: string;
}): NatesclawExecPolicyForCodexAppServer {
  const basePolicy = resolveNatesclawExecPolicyFromConfig({
    config: params.config,
    agentId: params.agentId,
  });
  const overridePolicy = applyNatesclawExecPolicyLayer(basePolicy, params.execOverrides);
  const approvalFloors = resolveNatesclawExecApprovalFloorsForCodexAppServer({
    approvals: params.approvals,
    agentId: params.agentId,
    policy: overridePolicy,
  });
  return applyNatesclawExecApprovalFloors(overridePolicy, approvalFloors);
}

export function resolveEffectiveNatesclawExecModeForCodexAppServer(params: {
  execMode?: NatesclawExecMode;
  execPolicy?: NatesclawExecPolicyForCodexAppServer;
}): NatesclawExecMode | undefined {
  if (params.execPolicy?.touched === true) {
    return params.execPolicy.mode;
  }
  return params.execMode;
}

export function resolveCodexPolicyModeForNatesclawExecMode(
  mode: NatesclawExecMode | undefined,
): CodexAppServerPolicyMode | undefined {
  if (!mode || mode === "full") {
    return undefined;
  }
  return "guardian";
}

export function assertCodexAppServerAllowedForNatesclawExecMode(
  mode: NatesclawExecMode | undefined,
): void {
  if (mode === "deny" || mode === "allowlist") {
    throw new AgentHarnessPreflightError(
      `Codex app-server local execution is unavailable because effective tools.exec.mode=${mode}. ` +
        "Execution-host approvals are authoritative. For gateway turns, inspect them with `natesclaw approvals get --gateway` and update that same target with `natesclaw approvals set --gateway --stdin`; for local `agent exec`, omit `--gateway`. Intentionally align that host policy before retrying.",
      { scope: "harness" },
    );
  }
}

function createDefaultNatesclawExecPolicy(): NatesclawExecPolicy {
  return {
    security: "full",
    ask: "off",
    touched: false,
  };
}

function applyNatesclawExecPolicyLayer(
  base: NatesclawExecPolicy,
  exec?: { mode?: unknown; security?: unknown; ask?: unknown },
): NatesclawExecPolicy {
  if (!exec) {
    return base;
  }
  const mode = readExecMode(exec.mode);
  if (mode !== undefined) {
    return {
      ...resolveNatesclawExecPolicyForMode(mode),
      touched: true,
    };
  }
  const security = readExecSecurity(exec.security);
  const ask = readExecAsk(exec.ask);
  if (security === undefined && ask === undefined) {
    return base;
  }
  const nextSecurity = security ?? base.security;
  const nextAsk = ask ?? base.ask;
  return {
    mode: resolveNatesclawExecModeFromPolicy({ security: nextSecurity, ask: nextAsk }),
    security: nextSecurity,
    ask: nextAsk,
    touched: true,
  };
}

function resolveNatesclawExecApprovalFloorsForCodexAppServer(params: {
  approvals?: ExecApprovalsFile;
  agentId?: string;
  policy: NatesclawExecPolicy;
}): NatesclawExecApprovalFloorsForCodexAppServer | undefined {
  if (!params.approvals) {
    return undefined;
  }
  return resolveExecApprovalsFromFile({
    file: params.approvals,
    agentId: params.agentId,
    overrides: {
      security: params.policy.security,
      ask: params.policy.ask,
    },
  }).agent;
}

function applyNatesclawExecApprovalFloors(
  base: NatesclawExecPolicy,
  approvalFloors?: NatesclawExecApprovalFloorsForCodexAppServer,
): NatesclawExecPolicy {
  if (!approvalFloors) {
    return base;
  }
  const nextSecurity = approvalFloors.security
    ? minNatesclawExecSecurity(base.security, approvalFloors.security)
    : base.security;
  const nextAsk = approvalFloors.ask ? maxNatesclawExecAsk(base.ask, approvalFloors.ask) : base.ask;
  if (nextSecurity === base.security && nextAsk === base.ask) {
    return base;
  }
  return {
    mode: resolveNatesclawExecModeFromPolicy({ security: nextSecurity, ask: nextAsk }),
    security: nextSecurity,
    ask: nextAsk,
    touched: true,
  };
}

function resolveNatesclawExecPolicyForMode(
  mode: NatesclawExecMode,
): Omit<NatesclawExecPolicy, "touched"> {
  switch (mode) {
    case "deny":
      return { mode, security: "deny", ask: "off" };
    case "allowlist":
      return { mode, security: "allowlist", ask: "off" };
    case "ask":
    case "auto":
      return { mode, security: "allowlist", ask: "on-miss" };
    case "full":
      return { mode, security: "full", ask: "off" };
  }
  const exhaustiveMode: never = mode;
  return exhaustiveMode;
}

function resolveNatesclawExecModeFromPolicy(params: {
  security: NatesclawExecSecurity;
  ask: NatesclawExecAsk;
}): NatesclawExecMode {
  if (params.security === "deny") {
    return "deny";
  }
  if (params.security === "allowlist" && params.ask === "off") {
    return "allowlist";
  }
  if (params.security === "full" && params.ask !== "always") {
    return "full";
  }
  return "ask";
}

function minNatesclawExecSecurity(
  left: NatesclawExecSecurity,
  right: NatesclawExecSecurity,
): NatesclawExecSecurity {
  const order: Record<NatesclawExecSecurity, number> = { deny: 0, allowlist: 1, full: 2 };
  return order[left] <= order[right] ? left : right;
}

function maxNatesclawExecAsk(left: NatesclawExecAsk, right: NatesclawExecAsk): NatesclawExecAsk {
  const order: Record<NatesclawExecAsk, number> = { off: 0, "on-miss": 1, always: 2 };
  return order[left] >= order[right] ? left : right;
}

function readExecMode(value: unknown): NatesclawExecMode | undefined {
  return value === "deny" ||
    value === "allowlist" ||
    value === "ask" ||
    value === "auto" ||
    value === "full"
    ? value
    : undefined;
}
