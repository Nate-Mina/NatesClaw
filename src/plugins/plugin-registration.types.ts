import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import type { Command } from "commander";
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import type {
  DiagnosticEventPrivateData,
  DiagnosticEventInput,
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "../infra/diagnostic-events.js";
import type { DiagnosticTracePropagationBridge as DiagnosticTracePropagationBridgeContract } from "../infra/diagnostic-trace-propagation.js";
import type { SecurityAuditFinding } from "../security/audit.types.js";
import type { PluginLogger } from "./logger-types.js";

type ChannelPlugin = import("../channels/plugins/types.plugin.js").ChannelPlugin;
type DiagnosticTracePropagationBridge = DiagnosticTracePropagationBridgeContract<
  DiagnosticEventPayload,
  DiagnosticEventMetadata
>;

type PluginInteractiveHandlerResult = {
  handled?: boolean;
} | void;

export type PluginInteractiveRegistration<
  TContext = unknown,
  TChannel extends string = string,
  TResult = PluginInteractiveHandlerResult,
> = {
  channel: TChannel;
  namespace: string;
  handler: (ctx: TContext) => Promise<TResult> | TResult;
};

export type PluginInteractiveHandlerRegistration = PluginInteractiveRegistration;

export type NatesclawPluginHttpRouteAuth = "gateway" | "plugin";
export type NatesclawPluginHttpRouteMatch = "exact" | "prefix";
export type NatesclawPluginGatewayRuntimeScopeSurface = "write-default" | "trusted-operator";

export type NatesclawPluginHttpRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<boolean | void> | boolean | void;

export type NatesclawPluginHttpRouteUpgradeHandler = (
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => Promise<boolean | void> | boolean | void;

export type NatesclawPluginHttpRouteParams = {
  path: string;
  handler: NatesclawPluginHttpRouteHandler;
  handleUpgrade?: NatesclawPluginHttpRouteUpgradeHandler;
  auth: NatesclawPluginHttpRouteAuth;
  match?: NatesclawPluginHttpRouteMatch;
  gatewayRuntimeScopeSurface?: NatesclawPluginGatewayRuntimeScopeSurface;
  nodeCapability?: {
    surface: string;
    ttlMs?: number;
  };
  replaceExisting?: boolean;
};

export type NatesclawPluginHostedMediaResolver = (
  mediaUrl: string,
) => string | null | undefined | Promise<string | null | undefined>;

export type NatesclawPluginCliContext = {
  /**
   * Command object where this plugin should register its commands.
   *
   * For root CLI registrations this is the root `natesclaw` program. For nested
   * registrations it is the resolved parent command from `parentPath`.
   */
  program: Command;
  parentPath: readonly string[];
  config: NatesclawConfig;
  workspaceDir?: string;
  logger: PluginLogger;
};

export type NatesclawPluginCliRegistrar = (ctx: NatesclawPluginCliContext) => void | Promise<void>;

/**
 * Top-level CLI metadata for plugin-owned commands.
 *
 * Descriptors are the parse-time contract for lazy plugin CLI registration.
 * If you want Natesclaw to keep a plugin command lazy-loaded while still
 * advertising it at the root CLI level, provide descriptors that cover every
 * top-level command root registered by that plugin CLI surface.
 */
type NatesclawPluginCliCommandDescriptor = {
  name: string;
  description: string;
  hasSubcommands: boolean;
};

/** Root-command metadata that is available before a plugin registrar is activated. */
export type NatesclawPluginCliRootCommandDescriptor = NatesclawPluginCliCommandDescriptor & {
  machineOutput?: (params: { argv: readonly string[]; stdoutIsTTY: boolean }) => boolean;
};

type NatesclawPluginRootCliRegistrationOptions = {
  /** Omit or pass an empty path for root commands. */
  parentPath?: readonly [];
  commands?: readonly string[];
  descriptors?: readonly NatesclawPluginCliRootCommandDescriptor[];
};

/** Backward-compatible registration shape for dynamic root or nested paths. */
type NatesclawPluginLegacyCliRegistrationOptions = {
  parentPath?: readonly string[];
  commands?: readonly string[];
  descriptors?: readonly NatesclawPluginCliCommandDescriptor[];
};

export type NatesclawPluginCliRegistrationOptions =
  | NatesclawPluginRootCliRegistrationOptions
  | NatesclawPluginLegacyCliRegistrationOptions;

export type NatesclawPluginNodeCliFeatureOptions = {
  /** Explicit node feature command names owned under `natesclaw nodes`. */
  commands?: string[];
  /**
   * Parse-time command descriptors for lazy node feature CLI registration.
   *
   * Descriptors are registered under `natesclaw nodes`, so a descriptor named
   * `"camera"` exposes `natesclaw nodes camera`.
   */
  descriptors?: NatesclawPluginCliCommandDescriptor[];
};

export type NatesclawPluginReloadRegistration = {
  restartPrefixes?: string[];
  hotPrefixes?: string[];
  noopPrefixes?: string[];
};

export type {
  NatesclawPluginNodeHostCommand,
  NatesclawPluginNodeHostCommandAvailabilityContext,
  NatesclawPluginNodeHostCommandIo,
} from "./types.node-host.js";

export type NatesclawPluginNodeInvokeTransportResult =
  | {
      ok: true;
      payload?: unknown;
      payloadJSON?: string | null;
    }
  | {
      ok: false;
      code?: string;
      message: string;
      details?: Record<string, unknown>;
    };

type NatesclawPluginNodeInvokeApprovalDecision = "allow-once" | "allow-always" | "deny";

type NatesclawPluginNodeInvokePolicyApprovalRuntime = {
  request: (input: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    toolName?: string;
    toolCallId?: string;
    agentId?: string;
    sessionKey?: string;
    timeoutMs?: number;
  }) => Promise<{
    id?: string;
    decision?: NatesclawPluginNodeInvokeApprovalDecision | null;
  }>;
};

export type NatesclawPluginNodeInvokePolicyContext = {
  nodeId: string;
  command: string;
  params: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
  config: NatesclawConfig;
  pluginConfig?: Record<string, unknown>;
  node?: {
    nodeId: string;
    displayName?: string;
    platform?: string;
    deviceFamily?: string;
    commands?: string[];
  };
  client?: {
    connId?: string;
    scopes?: string[];
  } | null;
  approvals?: NatesclawPluginNodeInvokePolicyApprovalRuntime;
  invokeNode: (input?: {
    params?: unknown;
    timeoutMs?: number;
    idempotencyKey?: string;
  }) => Promise<NatesclawPluginNodeInvokeTransportResult>;
};

export type NatesclawPluginNodeInvokePolicyResult =
  | {
      ok: true;
      payload?: unknown;
      payloadJSON?: string | null;
    }
  | {
      ok: false;
      message: string;
      code?: string;
      details?: Record<string, unknown>;
      unavailable?: boolean;
    };

export type NatesclawPluginNodeInvokePolicy = {
  commands: string[];
  /**
   * Platforms where these node-handled commands should be allowlisted by default.
   * Omit for commands that require explicit `gateway.nodes.commands.allow`.
   */
  defaultPlatforms?: Array<"ios" | "android" | "macos" | "windows" | "linux" | "unknown">;
  /**
   * Dangerous policy commands are filtered out of default allowlists unless
   * explicitly allowed by config.
   */
  dangerous?: boolean;
  /**
   * iOS foreground-restricted commands should be queued for foreground delivery
   * when an iOS node reports BACKGROUND_UNAVAILABLE.
   */
  foregroundRestrictedOnIos?: boolean;
  handle: (
    ctx: NatesclawPluginNodeInvokePolicyContext,
  ) => Promise<NatesclawPluginNodeInvokePolicyResult> | NatesclawPluginNodeInvokePolicyResult;
};

export type NatesclawPluginSecurityAuditContext = {
  config: NatesclawConfig;
  sourceConfig: NatesclawConfig;
  env: NodeJS.ProcessEnv;
  stateDir: string;
  configPath: string;
};

export type NatesclawPluginSecurityAuditCollector = (
  ctx: NatesclawPluginSecurityAuditContext,
) => SecurityAuditFinding[] | Promise<SecurityAuditFinding[]>;

export type NatesclawGatewayDiscoveryAdvertiseContext = {
  machineDisplayName: string;
  gatewayPort: number;
  gatewayTlsEnabled: boolean;
  gatewayTlsFingerprintSha256?: string;
  gatewayDirectReachable: boolean;
  canvasPort?: number;
  tailnetDns?: string;
  sshPort?: number;
  cliPath?: string;
  minimal: boolean;
};

export type NatesclawGatewayDiscoveryService = {
  id: string;
  advertise: (
    ctx: NatesclawGatewayDiscoveryAdvertiseContext,
  ) => void | Promise<void | { stop?: () => void | Promise<void> }>;
};

/** Context passed to long-lived plugin services. */
export type NatesclawPluginServiceContext = {
  config: NatesclawConfig;
  workspaceDir?: string;
  stateDir: string;
  logger: PluginLogger;
  gatewayEvents?: import("./gateway-events.js").NatesclawPluginGatewayEvents;
  startupTrace?: {
    detail?: (name: string, metrics: ReadonlyArray<readonly [string, number | string]>) => void;
    measure: <T>(name: string, run: () => T | Promise<T>) => Promise<T>;
  };
  internalDiagnostics?: {
    emit: (event: DiagnosticEventInput, privateData?: DiagnosticEventPrivateData) => void;
    onEvent: (
      listener: (
        event: DiagnosticEventPayload,
        metadata: DiagnosticEventMetadata,
        privateData: DiagnosticEventPrivateData,
      ) => void,
    ) => () => void;
    registerTracePropagationBridge?: (bridge: DiagnosticTracePropagationBridge) => () => void;
  };
};

/** Background service registered by a plugin during `register(api)`. */
export type NatesclawPluginService = {
  id: string;
  start: (ctx: NatesclawPluginServiceContext) => void | Promise<void>;
  stop?: (ctx: NatesclawPluginServiceContext) => void | Promise<void>;
};

export type NatesclawPluginChannelRegistration = {
  plugin: ChannelPlugin;
};

/**
 * Public label exposed to plugin `register(api)` calls.
 *
 * Keep this as a compatibility signal for plugin authors. Loader internals
 * should derive explicit capability booleans from the mode instead of branching
 * on raw strings throughout the code path.
 *
 * - `full`: live runtime activation; long-lived side effects may start.
 * - `discovery`: read-only capability discovery; skip sockets/workers/clients.
 * - `tool-discovery`: capability discovery for executable tools; skip channel runtime hydration.
 * - `setup-only`: lightweight channel setup entry only.
 * - `setup-runtime`: setup flow that also needs the runtime channel entry.
 * - `cli-metadata`: CLI command metadata collection.
 */
export type PluginRegistrationMode =
  | "full"
  | "discovery"
  | "tool-discovery"
  | "setup-only"
  | "setup-runtime"
  | "cli-metadata";
