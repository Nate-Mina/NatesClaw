// Minimax setup module handles plugin onboarding behavior.

import { normalizeProviderId } from "natesclaw/plugin-sdk/provider-model-shared";
import {
  applyAgentDefaultModelPrimary,
  applyOnboardAuthAgentModelsAndProviders,
  type ModelProviderConfig,
  type NatesclawConfig,
} from "natesclaw/plugin-sdk/provider-onboard";
import {
  buildMinimaxApiModelDefinition,
  MINIMAX_API_BASE_URL,
  MINIMAX_CN_API_BASE_URL,
} from "./model-definitions.js";
import { MINIMAX_DEFAULT_MODEL_ID } from "./provider-models.js";

type MinimaxApiProviderConfigParams = {
  providerId: string;
  modelId: string;
  baseUrl: string;
};

function applyMinimaxApiProviderConfigWithBaseUrl(
  cfg: NatesclawConfig,
  params: MinimaxApiProviderConfigParams,
): NatesclawConfig {
  const providers = { ...cfg.models?.providers } as Record<string, ModelProviderConfig>;
  const normalizedProviderId = normalizeProviderId(params.providerId);
  const existingProvider =
    providers[params.providerId] ??
    Object.entries(providers).find(
      ([providerId]) => normalizeProviderId(providerId) === normalizedProviderId,
    )?.[1];
  const existingModels = existingProvider?.models ?? [];
  const apiModel = buildMinimaxApiModelDefinition(params.modelId);
  const hasApiModel = existingModels.some((model) => model.id === params.modelId);
  const mergedModels = hasApiModel ? existingModels : [...existingModels, apiModel];
  const { apiKey: existingApiKey, ...existingProviderRest } = existingProvider ?? {
    baseUrl: params.baseUrl,
    models: [],
  };
  const preservedApiKey =
    typeof existingApiKey === "string"
      ? existingApiKey.trim() === "" || existingApiKey.trim() === "minimax"
        ? undefined
        : existingApiKey
      : existingApiKey;
  providers[params.providerId] = {
    ...existingProviderRest,
    baseUrl: params.baseUrl,
    api: "anthropic-messages",
    authHeader: true,
    ...(preservedApiKey ? { apiKey: preservedApiKey } : {}),
    models: mergedModels.length > 0 ? mergedModels : [apiModel],
  };

  const models = { ...cfg.agents?.defaults?.models };
  const modelRef = `${params.providerId}/${params.modelId}`;
  models[modelRef] = {
    ...models[modelRef],
    alias: "Minimax",
  };

  return applyOnboardAuthAgentModelsAndProviders(cfg, { agentModels: models, providers });
}

function applyMinimaxApiConfigWithBaseUrl(
  cfg: NatesclawConfig,
  params: MinimaxApiProviderConfigParams,
): NatesclawConfig {
  const next = applyMinimaxApiProviderConfigWithBaseUrl(cfg, params);
  return applyAgentDefaultModelPrimary(next, `${params.providerId}/${params.modelId}`);
}

export function applyMinimaxApiProviderConfig(
  cfg: NatesclawConfig,
  modelId = MINIMAX_DEFAULT_MODEL_ID,
): NatesclawConfig {
  return applyMinimaxApiProviderConfigWithBaseUrl(cfg, {
    providerId: "minimax",
    modelId,
    baseUrl: MINIMAX_API_BASE_URL,
  });
}

export function applyMinimaxApiConfig(
  cfg: NatesclawConfig,
  modelId = MINIMAX_DEFAULT_MODEL_ID,
): NatesclawConfig {
  return applyMinimaxApiConfigWithBaseUrl(cfg, {
    providerId: "minimax",
    modelId,
    baseUrl: MINIMAX_API_BASE_URL,
  });
}

export function applyMinimaxApiProviderConfigCn(
  cfg: NatesclawConfig,
  modelId = MINIMAX_DEFAULT_MODEL_ID,
): NatesclawConfig {
  return applyMinimaxApiProviderConfigWithBaseUrl(cfg, {
    providerId: "minimax",
    modelId,
    baseUrl: MINIMAX_CN_API_BASE_URL,
  });
}

export function applyMinimaxApiConfigCn(
  cfg: NatesclawConfig,
  modelId = MINIMAX_DEFAULT_MODEL_ID,
): NatesclawConfig {
  return applyMinimaxApiConfigWithBaseUrl(cfg, {
    providerId: "minimax",
    modelId,
    baseUrl: MINIMAX_CN_API_BASE_URL,
  });
}
