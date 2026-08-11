import type { NatesclawConfig } from "../config/types.natesclaw.js";
import type { PluginMetadataSnapshot } from "../plugins/plugin-metadata-snapshot.js";
import "./models-config.plan.js";
import type { ProviderConfig } from "./models-config.providers.secrets.js";

type ResolveImplicitProvidersForModelsJson = (params: {
  agentDir: string;
  config: NatesclawConfig;
  discoveryAuthConfig?: NatesclawConfig;
  env: NodeJS.ProcessEnv;
  workspaceDir?: string;
  explicitProviders: Record<string, ProviderConfig>;
  pluginMetadataSnapshot?: Pick<PluginMetadataSnapshot, "index" | "manifestRegistry" | "owners">;
  providerDiscoveryProviderIds?: readonly string[];
  providerDiscoveryTimeoutMs?: number;
  providerDiscoveryEntriesOnly?: boolean;
}) => Promise<Record<string, ProviderConfig>>;

type PlanParams = Parameters<typeof import("./models-config.plan.js").planNatesclawModelsJson>[0];
type PlanResult = Awaited<
  ReturnType<typeof import("./models-config.plan.js").planNatesclawModelsJson>
>;
type ResolveProvidersParams = {
  cfg: NatesclawConfig;
  discoveryAuthConfig?: NatesclawConfig;
  agentDir: string;
  env: NodeJS.ProcessEnv;
  workspaceDir?: string;
  pluginMetadataSnapshot?: Pick<PluginMetadataSnapshot, "index" | "manifestRegistry" | "owners">;
  providerDiscoveryProviderIds?: readonly string[];
  providerDiscoveryTimeoutMs?: number;
  providerDiscoveryEntriesOnly?: boolean;
};
type PlanDeps = { resolveImplicitProviders?: ResolveImplicitProvidersForModelsJson };

type ModelsConfigPlanTestApi = {
  planNatesclawModelsJsonWithDeps(params: PlanParams, deps?: PlanDeps): Promise<PlanResult>;
  resolveProvidersForModelsJsonWithDeps(
    params: ResolveProvidersParams,
    deps?: PlanDeps,
  ): Promise<Record<string, ProviderConfig>>;
};

function getTestApi(): ModelsConfigPlanTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.modelsConfigPlanTestApi")
  ] as ModelsConfigPlanTestApi;
}

export const planNatesclawModelsJsonWithDeps = async (
  params: PlanParams,
  deps?: PlanDeps,
): Promise<PlanResult> => await getTestApi().planNatesclawModelsJsonWithDeps(params, deps);

export const resolveProvidersForModelsJsonWithDeps = async (
  params: ResolveProvidersParams,
  deps?: PlanDeps,
): Promise<Record<string, ProviderConfig>> =>
  await getTestApi().resolveProvidersForModelsJsonWithDeps(params, deps);
