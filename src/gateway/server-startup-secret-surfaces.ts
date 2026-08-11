import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { isTruthyEnvValue } from "../infra/env.js";
import type { ChannelAutostartSuppression } from "./server-channels.js";

type GatewaySecretsActivationReason = "startup" | "reload" | "restart-check";

/**
 * Keeps the recoverable source config separate from the SecretRef assignment
 * surface that is safe to resolve during crash-loop recovery.
 */
export function resolveGatewayStartupSecretProjection(params: {
  config: NatesclawConfig;
  reason: GatewaySecretsActivationReason;
  channelAutostartSuppression?: ChannelAutostartSuppression | null;
  env?: NodeJS.ProcessEnv;
}): { sourceConfig: NatesclawConfig; assignmentConfig?: NatesclawConfig } {
  const sourceConfig = resolveGatewayStartupSourceConfig(params.config, params.env ?? process.env);
  if (
    params.reason !== "startup" ||
    params.channelAutostartSuppression == null ||
    !sourceConfig.channels
  ) {
    return { sourceConfig };
  }
  return {
    sourceConfig,
    assignmentConfig: {
      ...sourceConfig,
      channels: undefined,
    },
  };
}

export function resolveGatewayStartupSourceConfig(
  config: NatesclawConfig,
  env: NodeJS.ProcessEnv,
): NatesclawConfig {
  const skipChannels =
    isTruthyEnvValue(env.NATESCLAW_SKIP_CHANNELS) || isTruthyEnvValue(env.NATESCLAW_SKIP_PROVIDERS);
  if (!skipChannels || !config.channels) {
    return config;
  }
  return {
    ...config,
    channels: undefined,
  };
}
