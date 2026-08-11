// Builds plugin API objects from config, registries, and runtime helpers.
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { attachPluginApiFacades, type NatesclawPluginApiWithoutFacades } from "./api-facades.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { NatesclawPluginApi, PluginLogger } from "./types.js";

type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: NatesclawPluginApi["registrationMode"];
  config: NatesclawConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      NatesclawPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerHostedMediaResolver"
      | "registerMcpServerConnectionResolver"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerSessionCatalog"
      | "registerCli"
      | "registerReload"
      | "registerNodeHostCommand"
      | "registerNodeInvokePolicy"
      | "registerSecurityAuditCollector"
      | "registerService"
      | "registerGatewayDiscoveryService"
      | "registerCliBackend"
      | "registerTextTransforms"
      | "registerConfigMigration"
      | "registerMigrationProvider"
      | "registerAutoEnableProbe"
      | "registerProvider"
      | "registerWorkerProvider"
      | "registerModelCatalogProvider"
      | "registerEmbeddingProvider"
      | "registerSpeechProvider"
      | "registerRealtimeTranscriptionProvider"
      | "registerRealtimeVoiceProvider"
      | "registerMediaUnderstandingProvider"
      | "registerTranscriptSourceProvider"
      | "registerImageGenerationProvider"
      | "registerVideoGenerationProvider"
      | "registerMusicGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerCompactionProvider"
      | "registerAgentHarness"
      | "registerCodexAppServerExtensionFactory"
      | "registerAgentToolResultMiddleware"
      | "registerSessionExtension"
      | "enqueueNextTurnInjection"
      | "registerTrustedToolPolicy"
      | "registerToolMetadata"
      | "registerControlUiDescriptor"
      | "registerRuntimeLifecycle"
      | "registerAgentEventSubscription"
      | "emitAgentEvent"
      | "setRunContext"
      | "getRunContext"
      | "clearRunContext"
      | "registerSessionSchedulerJob"
      | "registerSessionAction"
      | "sendSessionAttachment"
      | "scheduleSessionTurn"
      | "unscheduleSessionTurnsByTag"
      | "registerDetachedTaskRuntime"
      | "registerMemoryCapability"
      | "registerMemoryPromptSupplement"
      | "registerMemoryPromptPreparation"
      | "registerMemoryCorpusSupplement"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: NatesclawPluginApi["registerTool"] = () => {};
const noopRegisterHook: NatesclawPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: NatesclawPluginApi["registerHttpRoute"] = () => {};
const noopRegisterHostedMediaResolver: NatesclawPluginApi["registerHostedMediaResolver"] = () => {};
const noopRegisterMcpServerConnectionResolver: NatesclawPluginApi["registerMcpServerConnectionResolver"] =
  () => {};
const noopRegisterChannel: NatesclawPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: NatesclawPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterSessionCatalog: NatesclawPluginApi["registerSessionCatalog"] = () => {};
const noopRegisterCli: NatesclawPluginApi["registerCli"] = () => {};
const noopRegisterReload: NatesclawPluginApi["registerReload"] = () => {};
const noopRegisterNodeHostCommand: NatesclawPluginApi["registerNodeHostCommand"] = () => {};
const noopRegisterNodeInvokePolicy: NatesclawPluginApi["registerNodeInvokePolicy"] = () => {};
const noopRegisterSecurityAuditCollector: NatesclawPluginApi["registerSecurityAuditCollector"] =
  () => {};
const noopRegisterService: NatesclawPluginApi["registerService"] = () => {};
const noopRegisterGatewayDiscoveryService: NatesclawPluginApi["registerGatewayDiscoveryService"] =
  () => {};
const noopRegisterCliBackend: NatesclawPluginApi["registerCliBackend"] = () => {};
const noopRegisterTextTransforms: NatesclawPluginApi["registerTextTransforms"] = () => {};
const noopRegisterConfigMigration: NatesclawPluginApi["registerConfigMigration"] = () => {};
const noopRegisterMigrationProvider: NatesclawPluginApi["registerMigrationProvider"] = () => {};
const noopRegisterAutoEnableProbe: NatesclawPluginApi["registerAutoEnableProbe"] = () => {};
const noopRegisterProvider: NatesclawPluginApi["registerProvider"] = () => {};
const noopRegisterWorkerProvider: NatesclawPluginApi["registerWorkerProvider"] = () => {};
const noopRegisterModelCatalogProvider: NatesclawPluginApi["registerModelCatalogProvider"] =
  () => {};
const noopRegisterEmbeddingProvider: NatesclawPluginApi["registerEmbeddingProvider"] = () => {};
const noopRegisterSpeechProvider: NatesclawPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterRealtimeTranscriptionProvider: NatesclawPluginApi["registerRealtimeTranscriptionProvider"] =
  () => {};
const noopRegisterRealtimeVoiceProvider: NatesclawPluginApi["registerRealtimeVoiceProvider"] =
  () => {};
const noopRegisterMediaUnderstandingProvider: NatesclawPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterTranscriptsSourceProvider: NatesclawPluginApi["registerTranscriptSourceProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: NatesclawPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterVideoGenerationProvider: NatesclawPluginApi["registerVideoGenerationProvider"] =
  () => {};
const noopRegisterMusicGenerationProvider: NatesclawPluginApi["registerMusicGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: NatesclawPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: NatesclawPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: NatesclawPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: NatesclawPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: NatesclawPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: NatesclawPluginApi["registerContextEngine"] = () => {};
const noopRegisterCompactionProvider: NatesclawPluginApi["registerCompactionProvider"] = () => {};
const noopRegisterAgentHarness: NatesclawPluginApi["registerAgentHarness"] = () => {};
const noopRegisterCodexAppServerExtensionFactory: NatesclawPluginApi["registerCodexAppServerExtensionFactory"] =
  () => {};
const noopRegisterAgentToolResultMiddleware: NatesclawPluginApi["registerAgentToolResultMiddleware"] =
  () => {};
const noopRegisterSessionExtension: NatesclawPluginApi["registerSessionExtension"] = () => {};
const noopEnqueueNextTurnInjection: NatesclawPluginApi["enqueueNextTurnInjection"] = async (
  injection,
) => ({ enqueued: false, id: "", sessionKey: injection.sessionKey });
const noopRegisterTrustedToolPolicy: NatesclawPluginApi["registerTrustedToolPolicy"] = () => {};
const noopRegisterToolMetadata: NatesclawPluginApi["registerToolMetadata"] = () => {};
const noopRegisterControlUiDescriptor: NatesclawPluginApi["registerControlUiDescriptor"] = () => {};
const noopRegisterRuntimeLifecycle: NatesclawPluginApi["registerRuntimeLifecycle"] = () => {};
const noopRegisterAgentEventSubscription: NatesclawPluginApi["registerAgentEventSubscription"] =
  () => {};
const noopEmitAgentEvent: NatesclawPluginApi["emitAgentEvent"] = () => ({
  emitted: false,
  reason: "not wired",
});
const noopSetRunContext: NatesclawPluginApi["setRunContext"] = () => false;
const noopGetRunContext: NatesclawPluginApi["getRunContext"] = () => undefined;
const noopClearRunContext: NatesclawPluginApi["clearRunContext"] = () => {};
const noopRegisterSessionSchedulerJob: NatesclawPluginApi["registerSessionSchedulerJob"] = () =>
  undefined;
const noopRegisterSessionAction: NatesclawPluginApi["registerSessionAction"] = () => {};
const noopSendSessionAttachment: NatesclawPluginApi["sendSessionAttachment"] = async () => ({
  ok: false,
  error: "not wired",
});
const noopScheduleSessionTurn: NatesclawPluginApi["scheduleSessionTurn"] = async () => undefined;
const noopUnscheduleSessionTurnsByTag: NatesclawPluginApi["unscheduleSessionTurnsByTag"] =
  async () => ({ removed: 0, failed: 0 });
const noopRegisterDetachedTaskRuntime: NatesclawPluginApi["registerDetachedTaskRuntime"] = () => {};
const noopRegisterMemoryCapability: NatesclawPluginApi["registerMemoryCapability"] = () => {};
const noopRegisterMemoryPromptSupplement: NatesclawPluginApi["registerMemoryPromptSupplement"] =
  () => {};
const noopRegisterMemoryPromptPreparation: NatesclawPluginApi["registerMemoryPromptPreparation"] =
  () => {};
const noopRegisterMemoryCorpusSupplement: NatesclawPluginApi["registerMemoryCorpusSupplement"] =
  () => {};
const noopRegisterMemoryEmbeddingProvider: NatesclawPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: NatesclawPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): NatesclawPluginApi {
  const handlers = params.handlers ?? {};
  const registerCli = handlers.registerCli ?? noopRegisterCli;
  const api: NatesclawPluginApiWithoutFacades = {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerHostedMediaResolver:
      handlers.registerHostedMediaResolver ?? noopRegisterHostedMediaResolver,
    registerMcpServerConnectionResolver:
      handlers.registerMcpServerConnectionResolver ?? noopRegisterMcpServerConnectionResolver,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerSessionCatalog: handlers.registerSessionCatalog ?? noopRegisterSessionCatalog,
    registerCli,
    registerNodeCliFeature: (registrar, opts) =>
      registerCli(registrar, {
        ...opts,
        parentPath: ["nodes"],
      }),
    registerReload: handlers.registerReload ?? noopRegisterReload,
    registerNodeHostCommand: handlers.registerNodeHostCommand ?? noopRegisterNodeHostCommand,
    registerNodeInvokePolicy: handlers.registerNodeInvokePolicy ?? noopRegisterNodeInvokePolicy,
    registerSecurityAuditCollector:
      handlers.registerSecurityAuditCollector ?? noopRegisterSecurityAuditCollector,
    registerService: handlers.registerService ?? noopRegisterService,
    registerGatewayDiscoveryService:
      handlers.registerGatewayDiscoveryService ?? noopRegisterGatewayDiscoveryService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerTextTransforms: handlers.registerTextTransforms ?? noopRegisterTextTransforms,
    registerConfigMigration: handlers.registerConfigMigration ?? noopRegisterConfigMigration,
    registerMigrationProvider: handlers.registerMigrationProvider ?? noopRegisterMigrationProvider,
    registerAutoEnableProbe: handlers.registerAutoEnableProbe ?? noopRegisterAutoEnableProbe,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerWorkerProvider: handlers.registerWorkerProvider ?? noopRegisterWorkerProvider,
    registerModelCatalogProvider:
      handlers.registerModelCatalogProvider ?? noopRegisterModelCatalogProvider,
    registerEmbeddingProvider: handlers.registerEmbeddingProvider ?? noopRegisterEmbeddingProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerRealtimeTranscriptionProvider:
      handlers.registerRealtimeTranscriptionProvider ?? noopRegisterRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider:
      handlers.registerRealtimeVoiceProvider ?? noopRegisterRealtimeVoiceProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerTranscriptSourceProvider:
      handlers.registerTranscriptSourceProvider ?? noopRegisterTranscriptsSourceProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerVideoGenerationProvider:
      handlers.registerVideoGenerationProvider ?? noopRegisterVideoGenerationProvider,
    registerMusicGenerationProvider:
      handlers.registerMusicGenerationProvider ?? noopRegisterMusicGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerCompactionProvider:
      handlers.registerCompactionProvider ?? noopRegisterCompactionProvider,
    registerAgentHarness: handlers.registerAgentHarness ?? noopRegisterAgentHarness,
    registerCodexAppServerExtensionFactory:
      handlers.registerCodexAppServerExtensionFactory ?? noopRegisterCodexAppServerExtensionFactory,
    registerAgentToolResultMiddleware:
      handlers.registerAgentToolResultMiddleware ?? noopRegisterAgentToolResultMiddleware,
    registerSessionExtension: handlers.registerSessionExtension ?? noopRegisterSessionExtension,
    enqueueNextTurnInjection: handlers.enqueueNextTurnInjection ?? noopEnqueueNextTurnInjection,
    registerTrustedToolPolicy: handlers.registerTrustedToolPolicy ?? noopRegisterTrustedToolPolicy,
    registerToolMetadata: handlers.registerToolMetadata ?? noopRegisterToolMetadata,
    registerControlUiDescriptor:
      handlers.registerControlUiDescriptor ?? noopRegisterControlUiDescriptor,
    registerRuntimeLifecycle: handlers.registerRuntimeLifecycle ?? noopRegisterRuntimeLifecycle,
    registerAgentEventSubscription:
      handlers.registerAgentEventSubscription ?? noopRegisterAgentEventSubscription,
    emitAgentEvent: handlers.emitAgentEvent ?? noopEmitAgentEvent,
    setRunContext: handlers.setRunContext ?? noopSetRunContext,
    getRunContext: handlers.getRunContext ?? noopGetRunContext,
    clearRunContext: handlers.clearRunContext ?? noopClearRunContext,
    registerSessionSchedulerJob:
      handlers.registerSessionSchedulerJob ?? noopRegisterSessionSchedulerJob,
    registerSessionAction: handlers.registerSessionAction ?? noopRegisterSessionAction,
    sendSessionAttachment: handlers.sendSessionAttachment ?? noopSendSessionAttachment,
    scheduleSessionTurn: handlers.scheduleSessionTurn ?? noopScheduleSessionTurn,
    unscheduleSessionTurnsByTag:
      handlers.unscheduleSessionTurnsByTag ?? noopUnscheduleSessionTurnsByTag,
    registerDetachedTaskRuntime:
      handlers.registerDetachedTaskRuntime ?? noopRegisterDetachedTaskRuntime,
    registerMemoryCapability: handlers.registerMemoryCapability ?? noopRegisterMemoryCapability,
    registerMemoryPromptSupplement:
      handlers.registerMemoryPromptSupplement ?? noopRegisterMemoryPromptSupplement,
    registerMemoryPromptPreparation:
      handlers.registerMemoryPromptPreparation ?? noopRegisterMemoryPromptPreparation,
    registerMemoryCorpusSupplement:
      handlers.registerMemoryCorpusSupplement ?? noopRegisterMemoryCorpusSupplement,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
  return attachPluginApiFacades(api);
}
